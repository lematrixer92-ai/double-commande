"use server";

import { redirect } from "next/navigation";
import { supprimerAbonnement } from "@/app/(connecte)/notifications/actions";
import { creerClientServeur } from "@/lib/supabase/serveur";

export async function seDeconnecter(formulaire?: FormData) {
  // Cet appareil ne reçoit plus les notifications de ce compte.
  const endpoint = String(formulaire?.get("endpoint") ?? "");
  if (endpoint) await supprimerAbonnement(endpoint);

  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}
