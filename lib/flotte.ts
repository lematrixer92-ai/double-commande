import { creerClientServeur } from "./supabase/serveur";

/*
  La flotte de l'auto-école : les voitures et les cartes blanches,
  avec le prénom de la personne qui les a.
  La sécurité de la base ne renvoie que celles de MON auto-école.
*/

export type Voiture = {
  id: string;
  modele: string;
  immatriculation: string;
  boite: "manuelle" | "automatique";
  controle_technique: string | null;
  fin_assurance: string | null;
  prochain_entretien: string | null;
  dernier_lavage: string | null;
  plein_a_faire: boolean;
  a_verifier: boolean;
  probleme: string | null;
  indisponible: boolean;
  raison_indisponible: string | null;
  pris_par: string | null;
  pris_depuis: string | null;
};

export type CarteBlanche = {
  id: string;
  nom: string;
  pris_par: string | null;
  pris_depuis: string | null;
};

// Le lavage est à faire tous les 11 jours.
export const JOURS_ENTRE_LAVAGES = 11;

const COLONNES_VOITURE =
  "id, modele, immatriculation, boite, controle_technique, fin_assurance, prochain_entretien, dernier_lavage, plein_a_faire, a_verifier, probleme, indisponible, raison_indisponible, pris_par, pris_depuis";

export async function chargerFlotte() {
  const supabase = await creerClientServeur();
  const [voitures, cartes, personnes] = await Promise.all([
    supabase.from("voitures").select(COLONNES_VOITURE).order("modele").order("immatriculation"),
    supabase.from("cartes").select("id, nom, pris_par, pris_depuis").order("nom"),
    supabase.from("personnes").select("id, prenom"),
  ]);

  const prenoms = new Map<string, string>(
    (personnes.data ?? []).map((p) => [p.id, p.prenom]),
  );

  return {
    voitures: (voitures.data ?? []) as Voiture[],
    cartes: (cartes.data ?? []) as CarteBlanche[],
    prenoms,
  };
}

// --- Dates et heures, toujours à l'heure de Paris ----------------------

const FUSEAU = "Europe/Paris";

// « 2026-10-24 » : la date du jour en France.
export function aujourdhui(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(new Date());
}

// Nombre de jours entre deux dates « AAAA-MM-JJ ».
export function joursEntre(debut: string, fin: string): number {
  return Math.round((Date.parse(fin) - Date.parse(debut)) / 86_400_000);
}

// « depuis 14h05 », ou « depuis le 23/10 à 18h30 » si ce n'est pas aujourd'hui.
export function depuisQuand(instant: string | null): string {
  if (!instant) return "";
  const date = new Date(instant);
  const heure = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(":", "h");
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(date);
  if (jour === aujourdhui()) return `depuis ${heure}`;
  const jourCourt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  return `depuis le ${jourCourt} à ${heure}`;
}

// « 2026-11-12 » -> « 12/11/2026 ».
export function dateCourte(date: string): string {
  const [annee, mois, jour] = date.split("-");
  return `${jour}/${mois}/${annee}`;
}

// Les alertes de dates s'affichent 30 jours avant l'échéance.
export const JOURS_ALERTE = 30;

// Une échéance (contrôle technique, assurance, entretien), en une phrase :
// « le 12/11/2026 (dans 18 jours) », « dépassée depuis 3 jours (le 21/10/2026) ».
export type NiveauEcheance = "vide" | "ok" | "bientot" | "depassee";

export function echeance(date: string | null): { texte: string; niveau: NiveauEcheance } {
  if (!date) return { texte: "pas encore renseignée", niveau: "vide" };
  const jours = joursEntre(aujourdhui(), date);
  const quand = dateCourte(date);
  if (jours < 0) {
    const n = -jours;
    return { texte: `dépassée depuis ${n} jour${n > 1 ? "s" : ""} (le ${quand})`, niveau: "depassee" };
  }
  if (jours === 0) return { texte: `aujourd'hui (le ${quand})`, niveau: "bientot" };
  const dans = jours === 1 ? "demain" : `dans ${jours} jours`;
  return {
    texte: `le ${quand} (${dans})`,
    niveau: jours <= JOURS_ALERTE ? "bientot" : "ok",
  };
}

// L'état du lavage, en une phrase.
export function etatLavage(dernierLavage: string | null): { texte: string; aFaire: boolean } {
  if (!dernierLavage) return { texte: "Lavage : jamais noté", aFaire: true };
  const jours = joursEntre(dernierLavage, aujourdhui());
  const aFaire = jours >= JOURS_ENTRE_LAVAGES;
  const quand =
    jours <= 0 ? "aujourd'hui" : jours === 1 ? "hier" : `il y a ${jours} jours`;
  return { texte: `Lavée ${quand}${aFaire ? " : lavage à faire" : ""}`, aFaire };
}

// L'état principal d'une voiture, comme affiché sur sa fiche.
export type Etat = "libre" | "en_lecon" | "a_verifier" | "indisponible";

export function etatVoiture(v: Voiture): Etat {
  if (v.indisponible) return "indisponible";
  if (v.pris_par) return "en_lecon";
  if (v.a_verifier) return "a_verifier";
  return "libre";
}

// « avec Karim depuis 14h05 », la raison d'une indisponibilité...
export function phraseEtat(v: Voiture, prenom: (id: string | null) => string): string {
  if (v.indisponible) return v.raison_indisponible ?? "";
  if (v.pris_par) return `avec ${prenom(v.pris_par)} ${depuisQuand(v.pris_depuis)}`;
  if (v.a_verifier) return "un problème a été signalé";
  return "";
}
