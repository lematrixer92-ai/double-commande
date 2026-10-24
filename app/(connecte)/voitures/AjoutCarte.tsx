"use client";

import { useActionState, useEffect, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import MessagePassager from "@/components/MessagePassager";
import { ajouterCarte } from "./actions";

// « Ajouter une carte » (secrétariat) : un bouton qui ouvre un petit formulaire.
export default function AjoutCarte() {
  const [etat, action, enCours] = useActionState(ajouterCarte, {});
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");

  // Carte bien ajoutée : on vide et on referme.
  useEffect(() => {
    if (etat.succes) {
      setNom("");
      setOuvert(false);
    }
  }, [etat]);

  if (!ouvert) {
    return (
      <>
        <button
          className="bouton bouton-petit bouton-secondaire espace-haut"
          type="button"
          onClick={() => setOuvert(true)}
        >
          Ajouter une carte
        </button>
        <MessagePassager etat={etat} />
      </>
    );
  }

  return (
    <form action={action} className="formulaire panneau">
      <label className="champ">
        Nom de la carte
        <input
          name="nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. : Carte blanche 1"
          maxLength={60}
          required
        />
      </label>
      <div className="boutons">
        <button className="bouton bouton-petit" type="submit" disabled={enCours}>
          {enCours ? "Ajout..." : "Ajouter"}
        </button>
        <button
          className="bouton bouton-petit bouton-secondaire"
          type="button"
          onClick={() => setOuvert(false)}
        >
          Annuler
        </button>
      </div>
      <MessageFormulaire etat={etat} />
    </form>
  );
}
