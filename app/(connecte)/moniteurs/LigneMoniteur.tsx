"use client";

import { useActionState, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import { nouveauLien, supprimerMoniteur } from "./actions";
import PartageLien from "./PartageLien";

type Props = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  statut: string | null;
};

export default function LigneMoniteur({ id, prenom, nom, email, statut }: Props) {
  const [etatLien, actionLien, lienEnCours] = useActionState(nouveauLien, {});
  const [etatSuppr, actionSuppr, supprEnCours] = useActionState(supprimerMoniteur, {});
  const [confirmer, setConfirmer] = useState(false);

  return (
    <li className="ligne">
      <div>
        <p className="ligne-nom">
          {prenom} {nom}
        </p>
        <p className="ligne-detail">{email}</p>
        {statut && <p className="ligne-detail">{statut}</p>}
      </div>

      {!confirmer ? (
        <div className="boutons">
          <form action={actionLien}>
            <input type="hidden" name="id" value={id} />
            <button className="bouton bouton-petit bouton-secondaire" type="submit" disabled={lienEnCours}>
              Nouveau lien
            </button>
          </form>
          <button
            className="bouton bouton-petit bouton-danger-leger"
            type="button"
            onClick={() => setConfirmer(true)}
          >
            Supprimer
          </button>
        </div>
      ) : (
        <form action={actionSuppr} className="confirmation">
          <p>
            Supprimer le compte de {prenom} ? Sa voiture et sa carte seront
            rendues, et ses messages effacés.
          </p>
          <input type="hidden" name="id" value={id} />
          <div className="boutons">
            <button className="bouton bouton-petit bouton-danger" type="submit" disabled={supprEnCours}>
              {supprEnCours ? "Suppression..." : "Oui, supprimer"}
            </button>
            <button
              className="bouton bouton-petit bouton-secondaire"
              type="button"
              onClick={() => setConfirmer(false)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <MessageFormulaire etat={etatSuppr} />
      <MessageFormulaire etat={etatLien} />
      {etatLien.lien && <PartageLien lien={etatLien.lien} prenom={prenom} />}
    </li>
  );
}
