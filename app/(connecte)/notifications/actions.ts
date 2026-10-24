"use server";

import { after } from "next/server";
import { maPersonne } from "@/lib/session";
import { notifier, notificationsReglees, raccourcir, secretariatDe } from "@/lib/notifications";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/serveur";

/*
  Les abonnements aux notifications d'un téléphone ou d'un ordinateur.
  Le navigateur donne une « adresse » (endpoint) et deux clés ; on les range
  au nom de la personne connectée. Si un autre compte s'était abonné sur le
  même appareil, l'abonnement passe à la personne connectée maintenant.
*/

type AbonnementNavigateur = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

type Resultat = { erreur?: string; succes?: string };

export async function enregistrerAbonnement(abonnement: AbonnementNavigateur): Promise<Resultat> {
  const moi = await maPersonne();
  if (!moi) return { erreur: "Impossible : tu n'es pas connecté." };
  if (!notificationsReglees) {
    return { erreur: "Impossible : les notifications ne sont pas encore réglées par le secrétariat." };
  }
  const { endpoint, keys } = abonnement ?? {};
  if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
    return { erreur: "Impossible : ce navigateur a donné un abonnement incomplet. Réessaie." };
  }

  const { error } = await creerClientAdmin()
    .from("abonnements_push")
    .upsert(
      { personne_id: moi.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint" },
    );
  if (error) return { erreur: "Impossible : l'abonnement n'a pas pu être enregistré. Réessaie." };
  return { succes: "Les notifications sont activées sur cet appareil." };
}

export async function supprimerAbonnement(endpoint: string): Promise<void> {
  const moi = await maPersonne();
  if (!moi || !endpoint) return;
  await creerClientAdmin()
    .from("abonnements_push")
    .delete()
    .eq("endpoint", endpoint)
    .eq("personne_id", moi.id);
}

// Vrai si cet appareil est abonné au nom de la personne connectée.
export async function abonnementEstAMoi(endpoint: string): Promise<boolean> {
  const moi = await maPersonne();
  if (!moi || !endpoint) return false;
  const { data } = await creerClientAdmin()
    .from("abonnements_push")
    .select("id")
    .eq("endpoint", endpoint)
    .eq("personne_id", moi.id)
    .maybeSingle();
  return Boolean(data);
}

export async function envoyerEssai(): Promise<Resultat> {
  const moi = await maPersonne();
  if (!moi) return { erreur: "Impossible : tu n'es pas connecté." };
  await notifier([moi.id], {
    titre: "Double Commande",
    texte: `Bravo ${moi.prenom}, les notifications marchent !`,
    url: "/notifications",
    tag: "essai",
  });
  return { succes: "Notification d'essai envoyée. Elle arrive dans quelques secondes." };
}

// Après l'envoi d'un message dans le mini chat : prévenir l'autre côté.
// Le message est relu avec le compte connecté (la base vérifie qu'il le voit).
export async function notifierNouveauMessage(messageId: number): Promise<void> {
  const moi = await maPersonne();
  if (!moi || !notificationsReglees) return;

  const supabase = await creerClientServeur();
  const { data: m } = await supabase
    .from("messages")
    .select("moniteur_id, auteur_id, contenu, cree_le")
    .eq("id", messageId)
    .maybeSingle();
  // Seulement pour un message que je viens d'écrire.
  if (!m || m.auteur_id !== moi.id) return;
  if (Date.now() - new Date(m.cree_le).getTime() > 2 * 60 * 1000) return;

  after(async () => {
    const versSecretariat = moi.role === "moniteur";
    const destinataires = versSecretariat
      ? await secretariatDe(moi.autoEcoleId, moi.id)
      : [m.moniteur_id as string];
    await notifier(destinataires, {
      titre: versSecretariat ? `Message de ${moi.prenom}` : "Message du secrétariat",
      texte: raccourcir(m.contenu),
      url: versSecretariat ? `/messages?avec=${m.moniteur_id}` : "/messages",
      tag: `chat-${m.moniteur_id}`,
    });
  });
}
