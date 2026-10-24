"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erreurDeLaBase, type EtatFormulaire } from "@/lib/erreurs";
import { aujourdhui } from "@/lib/flotte";
import { maPersonne } from "@/lib/session";
import { creerClientServeur } from "@/lib/supabase/serveur";

/*
  Les boutons des voitures et des cartes blanches.
  Chaque bouton appelle une fonction de la base (étape 2) : c'est elle qui
  vérifie les règles (voiture déjà prise, une seule voiture par moniteur,
  voiture indisponible...) et qui écrit le refus en français.
*/

const PAS_CONNECTE = "Impossible : tu n'es pas connecté.";
const REFUS_SECRETARIAT = "Impossible : seul le secrétariat peut gérer les voitures.";

// Après un changement, toutes les pages (voitures, fiche, À faire, accueil)
// se mettent à jour.
function rafraichir() {
  revalidatePath("/", "layout");
}

// Ce que fait chaque bouton d'une voiture, et le message en cas de réussite.
const ACTIONS_VOITURE = {
  prendre: { fonction: "prendre_voiture", succes: "C'est noté : tu as la voiture. Bonne leçon !" },
  rendre: { fonction: "rendre_voiture", succes: "C'est noté : la voiture est rendue. Merci !" },
  probleme: {
    fonction: "signaler_probleme",
    succes: "Problème signalé : la voiture passe « à vérifier » et le secrétariat est prévenu.",
  },
  plein: { fonction: "demander_plein", succes: "C'est noté : il faut faire le plein." },
  plein_fait: { fonction: "plein_fait", succes: "Merci : le plein est fait." },
  lavee: { fonction: "voiture_lavee", succes: "Merci : la voiture est notée lavée aujourd'hui." },
  indisponible: {
    fonction: "mettre_indisponible",
    succes: "La voiture est indisponible : personne ne peut la prendre.",
  },
  en_service: { fonction: "remettre_en_service", succes: "La voiture est remise en service." },
} as const;

type ActionVoiture = keyof typeof ACTIONS_VOITURE;

export async function actionVoiture(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  if (!(await maPersonne())) return { erreur: PAS_CONNECTE };

  const id = String(formulaire.get("id") ?? "");
  const nom = String(formulaire.get("action") ?? "") as ActionVoiture;
  const action = ACTIONS_VOITURE[nom];
  if (!action) return { erreur: "Impossible : action inconnue." };

  const texte = String(formulaire.get("texte") ?? "").trim() || null;
  const parametres =
    nom === "probleme"
      ? { p_voiture: id, p_description: texte }
      : nom === "indisponible"
        ? { p_voiture: id, p_raison: texte }
        : { p_voiture: id };

  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc(action.fonction, parametres);
  if (error) return { erreur: erreurDeLaBase(error) };

  rafraichir();
  return { succes: action.succes };
}

export async function actionCarte(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  if (!(await maPersonne())) return { erreur: PAS_CONNECTE };

  const id = String(formulaire.get("id") ?? "");
  const prendre = formulaire.get("action") === "prendre";

  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc(prendre ? "prendre_carte" : "rendre_carte", {
    p_carte: id,
  });
  if (error) return { erreur: erreurDeLaBase(error) };

  rafraichir();
  return { succes: prendre ? "C'est noté : tu as la carte." : "C'est noté : la carte est rendue." };
}

// --- Cartes du parking (secrétariat) -----------------------------------
// Facultatives : une auto-école peut n'en avoir aucune.

export async function ajouterCarte(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await maPersonne();
  if (moi?.role !== "secretariat") {
    return { erreur: "Impossible : seul le secrétariat peut ajouter une carte." };
  }
  const nom = String(formulaire.get("nom") ?? "").trim();
  if (!nom) return { erreur: "Impossible : donne un nom à la carte (ex. : Carte blanche 1)." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("cartes").insert({ nom });
  if (error) {
    if (error.code === "23505") return { erreur: "Impossible : une carte porte déjà ce nom." };
    return { erreur: erreurDeLaBase(error) };
  }

  rafraichir();
  return { succes: `La carte « ${nom} » est ajoutée.` };
}

export async function supprimerCarte(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await maPersonne();
  if (moi?.role !== "secretariat") {
    return { erreur: "Impossible : seul le secrétariat peut supprimer une carte." };
  }

  const supabase = await creerClientServeur();
  // On ne supprime pas une carte qu'un moniteur a dans la poche.
  const { data, error } = await supabase
    .from("cartes")
    .delete()
    .eq("id", String(formulaire.get("id") ?? ""))
    .is("pris_par", null)
    .select("id");
  if (error) return { erreur: erreurDeLaBase(error) };
  if (!data?.length) {
    return { erreur: "Impossible : cette carte est prise. Marque-la rendue avant de la supprimer." };
  }

  rafraichir();
  return { succes: "La carte est supprimée." };
}

// --- Fiche d'une voiture (secrétariat) ----------------------------------

// Une date du formulaire, ou rien si le champ est vide.
function dateOuRien(valeur: FormDataEntryValue | null): string | null {
  const texte = String(valeur ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texte) ? texte : null;
}

export async function enregistrerVoiture(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await maPersonne();
  if (moi?.role !== "secretariat") return { erreur: REFUS_SECRETARIAT };

  const id = String(formulaire.get("id") ?? "");
  const modele = String(formulaire.get("modele") ?? "").trim();
  const immatriculation = String(formulaire.get("immatriculation") ?? "").trim();
  const boite = formulaire.get("boite") === "automatique" ? "automatique" : "manuelle";

  if (!modele) return { erreur: "Impossible : écris le modèle de la voiture (ex. : Clio 5)." };
  if (!/^[A-Za-z]{2}[\s.-]?\d{3}[\s.-]?[A-Za-z]{2}$/.test(immatriculation)) {
    return { erreur: "Impossible : l'immatriculation doit ressembler à AB-123-CD." };
  }

  const fiche = {
    modele,
    immatriculation,
    boite,
    controle_technique: dateOuRien(formulaire.get("controle_technique")),
    fin_assurance: dateOuRien(formulaire.get("fin_assurance")),
    prochain_entretien: dateOuRien(formulaire.get("prochain_entretien")),
    dernier_lavage: dateOuRien(formulaire.get("dernier_lavage")),
  };

  const supabase = await creerClientServeur();
  const { error } = id
    ? await supabase.from("voitures").update(fiche).eq("id", id)
    : await supabase.from("voitures").insert(fiche);
  if (error) return { erreur: erreurDeLaBase(error) };

  rafraichir();
  // Une fiche modifiée : on reste dessus. Une nouvelle voiture : retour à la liste.
  if (id) return { succes: "C'est enregistré." };
  redirect("/voitures");
}

export async function supprimerVoiture(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await maPersonne();
  if (moi?.role !== "secretariat") return { erreur: REFUS_SECRETARIAT };

  const supabase = await creerClientServeur();
  const { error } = await supabase
    .from("voitures")
    .delete()
    .eq("id", String(formulaire.get("id") ?? ""));
  if (error) return { erreur: erreurDeLaBase(error) };

  rafraichir();
  redirect("/voitures");
}

// --- Entretiens (secrétariat) -------------------------------------------

export async function ajouterEntretien(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const moi = await maPersonne();
  if (moi?.role !== "secretariat") {
    return { erreur: "Impossible : seul le secrétariat peut ajouter un entretien." };
  }

  const date = dateOuRien(formulaire.get("date_entretien"));
  const travaux = String(formulaire.get("travaux") ?? "").trim();
  const garage = String(formulaire.get("garage") ?? "").trim() || null;
  const prochain = dateOuRien(formulaire.get("prochain_entretien"));
  // « 89,90 € » -> 89.9
  const prixTexte = String(formulaire.get("prix") ?? "")
    .replace(/[€\s]/g, "")
    .replace(",", ".");
  const prix = prixTexte === "" ? null : Number(prixTexte);

  if (!date) return { erreur: "Impossible : choisis la date de l'entretien." };
  if (date > aujourdhui()) {
    return { erreur: "Impossible : la date de l'entretien ne peut pas être dans le futur." };
  }
  if (!travaux) {
    return { erreur: "Impossible : écris ce qui a été fait (ex. : vidange et filtres)." };
  }
  if (prix !== null && (!Number.isFinite(prix) || prix < 0 || prix > 99_999_999)) {
    return { erreur: "Impossible : le prix doit être un nombre, par exemple 89,90." };
  }
  if (prochain && prochain <= date) {
    return { erreur: "Impossible : le prochain entretien doit être après celui-ci." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("entretiens").insert({
    voiture_id: String(formulaire.get("voiture_id") ?? ""),
    date_entretien: date,
    travaux,
    garage,
    prix: prix === null ? null : Math.round(prix * 100) / 100,
    prochain_entretien: prochain,
  });
  if (error) return { erreur: erreurDeLaBase(error) };

  rafraichir();
  return {
    succes: prochain
      ? "Entretien ajouté. La date du prochain entretien est mise à jour sur la fiche."
      : "Entretien ajouté.",
  };
}
