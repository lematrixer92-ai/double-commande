"use client";

import { useActionState, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import type { Voiture } from "@/lib/flotte";
import { enregistrerVoiture, supprimerVoiture } from "./actions";

// La fiche d'une voiture à remplir : vide pour une nouvelle voiture,
// pré-remplie pour la modifier.
export default function FormulaireVoiture({ voiture }: { voiture?: Voiture }) {
  const [etat, action, enCours] = useActionState(enregistrerVoiture, {});
  const [etatSuppr, actionSuppr, supprEnCours] = useActionState(supprimerVoiture, {});
  const [confirmer, setConfirmer] = useState(false);

  // Les champs sont gardés ici pour ne pas être vidés après un refus.
  const [champs, setChamps] = useState({
    modele: voiture?.modele ?? "",
    immatriculation: voiture?.immatriculation ?? "",
    boite: voiture?.boite ?? "manuelle",
    controle_technique: voiture?.controle_technique ?? "",
    fin_assurance: voiture?.fin_assurance ?? "",
    prochain_entretien: voiture?.prochain_entretien ?? "",
    dernier_lavage: voiture?.dernier_lavage ?? "",
  });

  const champ = (nom: keyof typeof champs) => ({
    name: nom,
    value: champs[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setChamps({ ...champs, [nom]: e.target.value }),
  });

  const boite = (valeur: "manuelle" | "automatique") => ({
    type: "radio",
    name: "boite",
    value: valeur,
    checked: champs.boite === valeur,
    onChange: () => setChamps({ ...champs, boite: valeur }),
  });

  const date = (nom: keyof typeof champs, texte: string) => (
    <label className="champ">
      {texte}
      <input type="date" {...champ(nom)} />
    </label>
  );

  return (
    <>
      <form action={action} className="formulaire">
        {voiture && <input type="hidden" name="id" value={voiture.id} />}
        <label className="champ">
          Modèle
          <input {...champ("modele")} placeholder="Ex. : Clio 5" required />
        </label>
        <label className="champ">
          Immatriculation
          <input
            {...champ("immatriculation")}
            placeholder="AB-123-CD"
            autoCapitalize="characters"
            autoComplete="off"
            required
          />
        </label>
        <fieldset className="champ choix">
          <legend>Boîte</legend>
          <label>
            <input {...boite("manuelle")} />
            Manuelle
          </label>
          <label>
            <input {...boite("automatique")} />
            Automatique
          </label>
        </fieldset>
        {date("controle_technique", "Prochain contrôle technique")}
        {date("fin_assurance", "Fin de l'assurance")}
        {date("prochain_entretien", "Prochain entretien")}
        {date("dernier_lavage", "Dernier lavage")}
        <p className="aide">Les dates sont facultatives : tu peux les remplir plus tard.</p>

        <button className="bouton" type="submit" disabled={enCours}>
          {enCours ? "Enregistrement..." : voiture ? "Enregistrer" : "Ajouter cette voiture"}
        </button>
        <MessageFormulaire etat={etat} />
      </form>

      {voiture &&
        (!confirmer ? (
          <button
            className="bouton bouton-danger-leger"
            type="button"
            onClick={() => setConfirmer(true)}
          >
            Supprimer cette voiture
          </button>
        ) : (
          <form action={actionSuppr} className="carte confirmation">
            <p>
              Supprimer la voiture {voiture.immatriculation} ? Son historique et ses
              entretiens seront effacés aussi.
            </p>
            <input type="hidden" name="id" value={voiture.id} />
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
            <MessageFormulaire etat={etatSuppr} />
          </form>
        ))}
    </>
  );
}
