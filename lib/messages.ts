/*
  Le mini chat : ce qui sert à la fois sur le serveur et dans le téléphone
  (pas d'accès à la base ici).
*/

export type Message = {
  id: number;
  moniteur_id: string;
  auteur_id: string | null;
  contenu: string;
  cree_le: string;
  lu_le: string | null;
};

export const COLONNES_MESSAGE = "id, moniteur_id, auteur_id, contenu, cree_le, lu_le";

// On affiche les 200 derniers messages d'une conversation.
export const NOMBRE_MESSAGES = 200;

// Un message ne peut pas dépasser 2000 caractères (règle de la base).
export const LONGUEUR_MAX = 2000;

const FUSEAU = "Europe/Paris";
const jourDe = new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU });
const heureDe = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
});

// « 2026-10-24 » : le jour du message en France.
export function jourDuMessage(instant: string): string {
  return jourDe.format(new Date(instant));
}

// « 14h05 »
export function heureDuMessage(instant: string): string {
  return heureDe.format(new Date(instant)).replace(":", "h");
}

// « Aujourd'hui », « Hier », « Lundi 20 octobre »
export function nomDuJourMessage(jour: string): string {
  const auj = jourDe.format(new Date());
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

// Dans la liste des conversations : « 14h05 » aujourd'hui, sinon « 20/10 ».
export function quandCourt(instant: string): string {
  const jour = jourDuMessage(instant);
  if (jour === jourDe.format(new Date())) return heureDuMessage(instant);
  return `${jour.slice(8, 10)}/${jour.slice(5, 7)}`;
}

// Un message « de l'autre côté » : pour le moniteur, ceux du secrétariat ;
// pour le secrétariat, ceux du moniteur.
export function vientDuMoniteur(m: Pick<Message, "auteur_id" | "moniteur_id">): boolean {
  return m.auteur_id === m.moniteur_id;
}
