import { echeance, etatLavage } from "./flotte";
import { creerClientServeur } from "./supabase/serveur";

/*
  La liste « À faire » du secrétariat.
  C'est la base qui décide ce qui est à faire (vue liste_a_faire, étape 2) :
  alerte 30 jours avant une échéance, lavage tous les 11 jours.
  Ici on la range et on la met en phrases.
*/

export type TypeTache =
  | "indisponible"
  | "a_verifier"
  | "plein"
  | "controle_technique"
  | "assurance"
  | "entretien"
  | "lavage";

export type Tache = {
  cle: string;
  type: TypeTache;
  voitureId: string;
  modele: string;
  immatriculation: string;
  titre: string;
  detail: string;
};

export type Groupe = "urgent" | "bientot" | "courant";

export const GROUPES: Record<Groupe, { titre: string; aide: string }> = {
  urgent: {
    titre: "À régler vite",
    aide: "Voitures indisponibles ou à vérifier, dates dépassées.",
  },
  bientot: {
    titre: "Dans les 30 prochains jours",
    aide: "Contrôle technique, assurance et entretien à prévoir.",
  },
  courant: { titre: "Plein et lavage", aide: "À faire au quotidien." },
};

const TITRES: Record<TypeTache, string> = {
  indisponible: "Indisponible",
  a_verifier: "À vérifier",
  plein: "Plein à faire",
  controle_technique: "Contrôle technique",
  assurance: "Fin de l'assurance",
  entretien: "Entretien",
  lavage: "Lavage à faire",
};

// L'ordre dans chaque groupe.
const ORDRE: TypeTache[] = [
  "indisponible",
  "a_verifier",
  "controle_technique",
  "assurance",
  "entretien",
  "plein",
  "lavage",
];

type Ligne = {
  voiture_id: string;
  modele: string;
  immatriculation: string;
  type: TypeTache;
  echeance: string | null;
  en_retard: boolean;
  details: string | null;
};

function groupeDe(l: Ligne): Groupe {
  if (l.type === "indisponible" || l.type === "a_verifier") return "urgent";
  if (l.type === "plein" || l.type === "lavage") return "courant";
  return l.en_retard ? "urgent" : "bientot";
}

function detailDe(l: Ligne, dernierLavage: string | null): string {
  switch (l.type) {
    case "indisponible":
      return l.details ? `Raison : ${l.details}` : "Personne ne peut la prendre.";
    case "a_verifier":
      return l.details ? `Problème signalé : ${l.details}` : "Un moniteur a signalé un problème.";
    case "plein":
      return "Un moniteur a demandé de faire le plein.";
    case "lavage":
      return etatLavage(dernierLavage).texte.replace(" : lavage à faire", "");
    default:
      return `Échéance ${echeance(l.echeance).texte}`;
  }
}

export async function chargerAFaire(): Promise<Record<Groupe, Tache[]>> {
  const supabase = await creerClientServeur();
  const [{ data }, voitures] = await Promise.all([
    supabase
      .from("liste_a_faire")
      .select("voiture_id, modele, immatriculation, type, echeance, en_retard, details"),
    supabase.from("voitures").select("id, dernier_lavage"),
  ]);
  const lavageDe = new Map((voitures.data ?? []).map((v) => [v.id, v.dernier_lavage as string | null]));

  const groupes: Record<Groupe, Tache[]> = { urgent: [], bientot: [], courant: [] };
  const lignes = ((data ?? []) as Ligne[]).sort(
    (a, b) =>
      ORDRE.indexOf(a.type) - ORDRE.indexOf(b.type) ||
      (a.echeance ?? "").localeCompare(b.echeance ?? "") ||
      a.modele.localeCompare(b.modele),
  );

  for (const l of lignes) {
    groupes[groupeDe(l)].push({
      cle: `${l.voiture_id}-${l.type}`,
      type: l.type,
      voitureId: l.voiture_id,
      modele: l.modele,
      immatriculation: l.immatriculation,
      titre: TITRES[l.type],
      detail: detailDe(l, lavageDe.get(l.voiture_id) ?? null),
    });
  }
  return groupes;
}

// Le nombre de choses à faire (pour l'accueil).
export async function compterAFaire(): Promise<number> {
  const supabase = await creerClientServeur();
  const { count } = await supabase
    .from("liste_a_faire")
    .select("voiture_id", { count: "exact", head: true });
  return count ?? 0;
}
