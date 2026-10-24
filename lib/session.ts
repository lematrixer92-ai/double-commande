import { cache } from "react";
import { redirect } from "next/navigation";
import { creerClientServeur } from "./supabase/serveur";

export type Role = "secretariat" | "moniteur";

export type Personne = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  autoEcoleId: string;
  autoEcoleNom: string;
};

// Le compte connecté (vérifié auprès de Supabase), ou null.
export const utilisateurConnecte = cache(async () => {
  const supabase = await creerClientServeur();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

// La fiche de la personne connectée : prénom, rôle, auto-école.
export const maPersonne = cache(async (): Promise<Personne | null> => {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return null;

  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("personnes")
    .select("id, prenom, nom, email, role, auto_ecole_id, auto_ecoles(nom)")
    .eq("id", utilisateur.id)
    .maybeSingle();
  if (!data) return null;

  const ecole = data.auto_ecoles as unknown as { nom: string } | null;
  return {
    id: data.id,
    prenom: data.prenom,
    nom: data.nom,
    email: data.email,
    role: data.role,
    autoEcoleId: data.auto_ecole_id,
    autoEcoleNom: ecole?.nom ?? "",
  };
});

// À utiliser en haut des pages réservées : renvoie vers la connexion sinon.
export async function exigerPersonne(): Promise<Personne> {
  const personne = await maPersonne();
  if (!personne) {
    redirect((await utilisateurConnecte()) ? "/compte-inconnu" : "/connexion");
  }
  return personne;
}

export async function exigerSecretariat(): Promise<Personne> {
  const personne = await exigerPersonne();
  if (personne.role !== "secretariat") redirect("/accueil");
  return personne;
}
