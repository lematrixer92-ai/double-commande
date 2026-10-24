"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { EtatFormulaire } from "@/lib/erreurs";
import { creerClientServeur } from "@/lib/supabase/serveur";

const TYPES_ACCEPTES: EmailOtpType[] = ["invite", "recovery", "magiclink", "email"];

// Ouvre la session grâce au lien reçu, puis on choisit son mot de passe.
export async function ouvrirLien(
  _etat: EtatFormulaire,
  formulaire: FormData,
): Promise<EtatFormulaire> {
  const jeton = String(formulaire.get("token_hash") ?? "");
  const type = String(formulaire.get("type") ?? "") as EmailOtpType;

  if (!jeton || !TYPES_ACCEPTES.includes(type)) {
    return { erreur: "Impossible : ce lien est incomplet. Demande un nouveau lien au secrétariat." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.verifyOtp({ token_hash: jeton, type });
  if (error) {
    return { erreur: "Impossible : ce lien a expiré ou a déjà servi. Demande un nouveau lien au secrétariat." };
  }

  redirect("/mot-de-passe?nouveau=1");
}

