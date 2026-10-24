import { aujourdhui } from "./flotte";
import { creerClientServeur } from "./supabase/serveur";

/*
  L'historique : tout ce qui s'est passé sur les voitures et les cartes.
  La base le remplit toute seule à chaque bouton (étape 2) ;
  ici on le lit et on le met en phrases.
*/

export type TypeEvenement =
  | "voiture_prise"
  | "voiture_rendue"
  | "carte_prise"
  | "carte_rendue"
  | "probleme_signale"
  | "plein_a_faire"
  | "plein_fait"
  | "lavage"
  | "mise_indisponible"
  | "remise_en_service"
  | "entretien";

export const TITRES: Record<TypeEvenement, string> = {
  voiture_prise: "Voiture prise",
  voiture_rendue: "Voiture rendue",
  carte_prise: "Carte prise",
  carte_rendue: "Carte rendue",
  probleme_signale: "Problème signalé",
  plein_a_faire: "Plein à faire",
  plein_fait: "Plein fait",
  lavage: "Lavage",
  mise_indisponible: "Mise indisponible",
  remise_en_service: "Remise en service",
  entretien: "Entretien",
};

// Les filtres de la page Historique.
export const FILTRES = {
  tout: { nom: "Tout", types: [] as TypeEvenement[] },
  entretiens: { nom: "Entretiens", types: ["entretien"] as TypeEvenement[] },
  problemes: { nom: "Problèmes", types: ["probleme_signale"] as TypeEvenement[] },
  disponibilite: {
    nom: "Indisponibilités",
    types: ["mise_indisponible", "remise_en_service"] as TypeEvenement[],
  },
  lavages: { nom: "Lavages", types: ["lavage"] as TypeEvenement[] },
  pleins: { nom: "Pleins", types: ["plein_a_faire", "plein_fait"] as TypeEvenement[] },
  prises: {
    nom: "Prises et retours",
    types: ["voiture_prise", "voiture_rendue", "carte_prise", "carte_rendue"] as TypeEvenement[],
  },
};

export type NomFiltre = keyof typeof FILTRES;

export type Evenement = {
  id: number;
  type: TypeEvenement;
  titre: string;
  // « Clio 5 », ou « Carte blanche 1 »
  objet: string | null;
  immatriculation: string | null;
  voitureId: string | null;
  // « Chafick », ou null si la personne a été supprimée (ou pour un automatisme)
  qui: string | null;
  details: string | null;
  jour: string; // AAAA-MM-JJ à l'heure de Paris
  heure: string; // 14h05
};

const FUSEAU = "Europe/Paris";

export async function chargerHistorique(options: {
  types?: TypeEvenement[];
  voitureId?: string;
  limite: number;
}): Promise<{ evenements: Evenement[]; encore: boolean }> {
  const supabase = await creerClientServeur();

  let requete = supabase
    .from("evenements")
    .select("id, type, voiture_id, carte_id, personne_id, details, cree_le")
    .order("cree_le", { ascending: false })
    .order("id", { ascending: false })
    // une ligne de plus pour savoir s'il en reste après
    .limit(options.limite + 1);
  if (options.types?.length) requete = requete.in("type", options.types);
  if (options.voitureId) requete = requete.eq("voiture_id", options.voitureId);

  const [lignes, voitures, cartes, personnes] = await Promise.all([
    requete,
    supabase.from("voitures").select("id, modele, immatriculation"),
    supabase.from("cartes").select("id, nom"),
    supabase.from("personnes").select("id, prenom"),
  ]);

  const voitureDe = new Map((voitures.data ?? []).map((v) => [v.id, v]));
  const carteDe = new Map((cartes.data ?? []).map((c) => [c.id, c.nom as string]));
  const prenomDe = new Map((personnes.data ?? []).map((p) => [p.id, p.prenom as string]));

  const jourDe = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU });
  const heureDe = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
  });

  const toutes = (lignes.data ?? []).map((e): Evenement => {
    const voiture = e.voiture_id ? voitureDe.get(e.voiture_id) : undefined;
    const date = new Date(e.cree_le);
    return {
      id: e.id,
      type: e.type,
      titre: TITRES[e.type as TypeEvenement] ?? e.type,
      objet: voiture?.modele ?? (e.carte_id ? carteDe.get(e.carte_id) ?? null : null),
      immatriculation: voiture?.immatriculation ?? null,
      voitureId: e.voiture_id,
      qui: e.personne_id ? prenomDe.get(e.personne_id) ?? null : null,
      details: e.details,
      jour: jourDe.format(date),
      heure: heureDe.format(date).replace(":", "h"),
    };
  });

  return {
    evenements: toutes.slice(0, options.limite),
    encore: toutes.length > options.limite,
  };
}

// « Aujourd'hui », « Hier », « Lundi 20 octobre »
export function nomDuJour(jour: string): string {
  const auj = aujourdhui();
  if (jour === auj) return "Aujourd'hui";
  const hier = new Date(Date.parse(auj) - 86_400_000).toISOString().slice(0, 10);
  if (jour === hier) return "Hier";
  const texte = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: jour.slice(0, 4) === auj.slice(0, 4) ? undefined : "numeric",
  }).format(new Date(`${jour}T12:00:00Z`));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}
