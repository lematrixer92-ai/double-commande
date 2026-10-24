"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { traduireErreur, type EtatFormulaire } from "@/lib/erreurs";
import { maPersonne } from "@/lib/session";
import { cleSecreteReglee, creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/serveur";

/*
  Les actions du secrétariat sur les comptes des moniteurs.
  Chacune vérifie d'abord, côté serveur, que la personne connectée fait
  partie du secrétariat. Le client « administrateur » n'est utilisé
  qu'après cette vérification.
*/

const REFUS_SECRETARIAT = "Impossible : seul le secrétariat peut gérer les moniteurs.";
const CLE_MANQUANTE =
  "Impossible : la clé secrète Supabase n'est pas encore réglée dans Vercel (SUPABASE_SECRET_KEY).";

async function secretariatConnecte() {
  const moi = await maPersonne();
  return moi?.role === "secretariat" ? moi : null;
}

// Un moniteur de MON auto-école (la sécurité de la base cache les autres).
async function monMoniteur(id: string) {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("personnes")
    .select("id, prenom, email, role")
    .eq("id", id)
    .maybeSingle();
  return data?.role === "moniteur" ? data : null;
}

// Fabrique le lien vers la page /bienvenue de ce site.
async function lienBienvenue(jeton: string, type: "invite" | "recovery") {
  const entetes = await headers();
  const hote = entetes.get("x-forwarded-host") ?? entetes.get("host");
  const protocole = entetes.get("x-forwarded-proto") ?? "https";
  const parametres = new URLSearchParams({ token_hash: jeton, type });
  return `${protocole}://${hote}/bienvenue?${parametres}`;
}

export async function inviterMoniteur(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await secretariatConnecte();
  if (!moi) return { erreur: REFUS_SECRETARIAT };
  if (!cleSecreteReglee) return { erreur: CLE_MANQUANTE };

  const prenom = String(formulaire.get("prenom") ?? "").trim();
  const nom = String(formulaire.get("nom") ?? "").trim();
  const email = String(formulaire.get("email") ?? "").trim().toLowerCase();

  if (!prenom) return { erreur: "Impossible : écris le prénom du moniteur." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { erreur: "Impossible : cette adresse e-mail n'est pas valide." };
  }

  const admin = creerClientAdmin();

  // Cette adresse a-t-elle déjà un compte (dans n'importe quelle auto-école) ?
  const { data: existant } = await admin
    .from("personnes")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existant) {
    return { erreur: "Impossible : un compte existe déjà avec cette adresse e-mail." };
  }

  // 1. Le compte de connexion, avec un lien d'invitation (aucun e-mail envoyé).
  const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email });
  if (error || !data.user) return { erreur: traduireErreur(error?.message) };

  // 2. Sa fiche dans l'auto-école du secrétariat, avec le rôle « moniteur ».
  //    C'est le serveur qui décide de l'auto-école et du rôle, jamais le formulaire.
  const { error: erreurFiche } = await admin.from("personnes").insert({
    id: data.user.id,
    auto_ecole_id: moi.autoEcoleId,
    prenom,
    nom,
    email,
    role: "moniteur",
  });
  if (erreurFiche) {
    // On n'efface le compte que s'il n'a vraiment aucune fiche.
    const { data: fiche } = await admin
      .from("personnes")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!fiche) await admin.auth.admin.deleteUser(data.user.id);
    return { erreur: "Impossible : le compte n'a pas pu être créé. Réessaie dans un instant." };
  }

  revalidatePath("/moniteurs");
  return {
    succes: `Le compte de ${prenom} est créé. Envoie-lui maintenant ce lien :`,
    lien: await lienBienvenue(data.properties.hashed_token, "invite"),
    prenom,
  };
}

export async function nouveauLien(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  if (!(await secretariatConnecte())) return { erreur: REFUS_SECRETARIAT };
  if (!cleSecreteReglee) return { erreur: CLE_MANQUANTE };

  const moniteur = await monMoniteur(String(formulaire.get("id") ?? ""));
  if (!moniteur) return { erreur: "Impossible : ce moniteur n'existe plus." };

  const { data, error } = await creerClientAdmin().auth.admin.generateLink({
    type: "recovery",
    email: moniteur.email,
  });
  if (error) return { erreur: traduireErreur(error.message) };

  return {
    succes: `Nouveau lien pour ${moniteur.prenom} :`,
    lien: await lienBienvenue(data.properties.hashed_token, "recovery"),
  };
}

export async function supprimerMoniteur(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  if (!(await secretariatConnecte())) return { erreur: REFUS_SECRETARIAT };
  if (!cleSecreteReglee) return { erreur: CLE_MANQUANTE };

  const moniteur = await monMoniteur(String(formulaire.get("id") ?? ""));
  if (!moniteur) return { erreur: "Impossible : ce moniteur n'existe plus." };

  // Supprimer le compte efface aussi sa fiche ; la base rend alors
  // automatiquement sa voiture et sa carte, et efface ses messages.
  const { error } = await creerClientAdmin().auth.admin.deleteUser(moniteur.id);
  if (error) return { erreur: traduireErreur(error.message) };

  revalidatePath("/moniteurs");
  return { succes: `Le compte de ${moniteur.prenom} est supprimé.` };
}
