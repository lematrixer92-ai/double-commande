import "server-only";
import webpush from "web-push";
import { creerClientAdmin } from "./supabase/admin";

/*
  L'envoi des notifications (étape 7).

  Les deux clés « VAPID » prouvent aux téléphones que les notifications
  viennent bien de Double Commande :
  - VAPID_PUBLIC_KEY : publique, donnée au téléphone quand il s'abonne ;
  - VAPID_PRIVATE_KEY : secrète, réglée dans Vercel en type « Secret ».
  Elles ne sont JAMAIS dans le code ni sur GitHub.

  Le serveur lit les abonnements avec le client administrateur : la table
  abonnements_push n'est ouverte à aucun compte.
*/

const clePublique = process.env.VAPID_PUBLIC_KEY ?? "";
const clePrivee = process.env.VAPID_PRIVATE_KEY ?? "";

export const notificationsReglees = Boolean(clePublique && clePrivee);

export function clePubliqueVapid(): string | null {
  return notificationsReglees ? clePublique : null;
}

export type Notification = {
  titre: string;
  texte: string;
  // La page ouverte quand on appuie sur la notification.
  url: string;
  // Deux notifications avec le même « tag » : la nouvelle remplace l'ancienne.
  tag?: string;
};

type Abonnement = { id: number; endpoint: string; p256dh: string; auth: string };

// Envoie une notification à tous les appareils de ces personnes.
export async function notifier(personnes: string[], notification: Notification) {
  if (!notificationsReglees || personnes.length === 0) return;

  const admin = creerClientAdmin();
  const { data } = await admin
    .from("abonnements_push")
    .select("id, endpoint, p256dh, auth")
    .in("personne_id", personnes);
  const abonnements = (data ?? []) as Abonnement[];
  if (abonnements.length === 0) return;

  const contenu = JSON.stringify(notification);
  const options = {
    vapidDetails: {
      subject: process.env.VAPID_SUBJECT || "https://double-commande.vercel.app",
      publicKey: clePublique,
      privateKey: clePrivee,
    },
    TTL: 24 * 60 * 60, // si le téléphone est éteint, on réessaie pendant 1 jour
    urgency: "high" as const,
  };

  const perimes: number[] = [];
  await Promise.all(
    abonnements.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          contenu,
          options,
        );
      } catch (erreur) {
        // 404 / 410 : l'appareil a retiré l'autorisation ou l'appli est désinstallée.
        const code = (erreur as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) perimes.push(a.id);
        else console.error("Notification non envoyée :", code ?? erreur);
      }
    }),
  );
  if (perimes.length) await admin.from("abonnements_push").delete().in("id", perimes);
}

// Les personnes du secrétariat d'une auto-école (sauf, éventuellement, une).
export async function secretariatDe(autoEcoleId: string, sauf?: string): Promise<string[]> {
  const admin = creerClientAdmin();
  const { data } = await admin
    .from("personnes")
    .select("id")
    .eq("auto_ecole_id", autoEcoleId)
    .eq("role", "secretariat");
  return (data ?? []).map((p) => p.id as string).filter((id) => id !== sauf);
}

// Une phrase courte pour l'aperçu d'une notification.
export function raccourcir(texte: string, longueur = 120): string {
  const propre = texte.replace(/\s+/g, " ").trim();
  return propre.length > longueur ? `${propre.slice(0, longueur - 1)}…` : propre;
}
