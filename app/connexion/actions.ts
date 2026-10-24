"use server";

import { redirect } from "next/navigation";
import { traduireErreur, type EtatFormulaire } from "@/lib/erreurs";
import { creerClientServeur } from "@/lib/supabase/serveur";

export async function seConnecter(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const email = String(formulaire.get("email") ?? "").trim();
  const motDePasse = String(formulaire.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Impossible : remplis ton adresse e-mail et ton mot de passe." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });
  if (error) return { erreur: traduireErreur(error.message) };

  redirect("/accueil");
}
