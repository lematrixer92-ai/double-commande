import type { EtatFormulaire } from "@/lib/erreurs";

// Affiche le résultat d'un formulaire : en rouge si c'est un refus.
export default function MessageFormulaire({ etat }: { etat: EtatFormulaire }) {
  if (etat.erreur) {
    return (
      <p className="message message-erreur" role="alert">
        {etat.erreur}
      </p>
    );
  }
  if (etat.succes) {
    return (
      <p className="message message-succes" role="status">
        {etat.succes}
      </p>
    );
  }
  return null;
}
