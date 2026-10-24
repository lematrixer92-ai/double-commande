"use server";

import { traduireErreur, type EtatFormulaire } from "@/lib/erreurs";
import { creerClientServeur } from "@/lib/supabase/serveur";

export async function changerMotDePasse(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const motDePasse = String(formulaire.get("mot_de_passe") ?? "");
  const confirmation = String(formulaire.get("confirmation") ?? "");

  if (motDePasse.length < 8) {
    return { erreur: "Impossible : ton mot de passe doit faire au moins 8 caractères." };
  }
  if (motDePasse !== confirmation) {
    return { erreur: "Impossible : les deux mots de passe ne sont pas pareils." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { erreur: traduireErreur(error.message) };

  return { succes: "C'est fait : ton mot de passe est enregistré." };
}
