// Traduit en français clair les messages d'erreur de Supabase.
export function traduireErreur(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();

  if (m.includes("invalid login credentials"))
    return "Impossible : adresse e-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Impossible : ce compte n'est pas encore activé. Ouvre le lien d'invitation reçu.";
  if (m.includes("already been registered") || m.includes("already registered") || m.includes("email_exists"))
    return "Impossible : un compte existe déjà avec cette adresse e-mail.";
  if (m.includes("should be different"))
    return "Impossible : choisis un mot de passe différent de l'ancien.";
  if (m.includes("password") && (m.includes("at least") || m.includes("weak") || m.includes("short")))
    return "Impossible : ce mot de passe est trop faible. Mets au moins 8 caractères.";
  if (m.includes("expired") || m.includes("otp"))
    return "Impossible : ce lien a expiré ou a déjà servi. Demande un nouveau lien au secrétariat.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Impossible : trop d'essais. Attends quelques minutes et réessaie.";
  if (m.includes("fetch") || m.includes("network"))
    return "Impossible : pas de connexion internet. Réessaie dans un instant.";

  return "Impossible : une erreur est survenue. Réessaie dans un instant.";
}

export type EtatFormulaire = {
  erreur?: string;
  succes?: string;
  lien?: string;
  prenom?: string;
};

// Les refus de la base (« Impossible : cette voiture est déjà prise par
// Karim... ») sont déjà écrits en français : on les affiche tels quels.
export function erreurDeLaBase(erreur: { code?: string; message?: string }): string {
  if (erreur.code === "P0001" && erreur.message) return erreur.message;
  if (erreur.code === "23505")
    return "Impossible : une voiture avec cette immatriculation existe déjà.";
  if (erreur.code === "23514")
    return "Impossible : une information n'est pas valide. Vérifie le modèle et l'immatriculation.";
  if (erreur.code === "42501")
    return "Impossible : tu n'as pas le droit de faire ça.";
  return traduireErreur(erreur.message);
}
