"use client";

import { useActionState, useEffect, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import MessagePassager from "@/components/MessagePassager";
import { ajouterEntretien } from "./actions";

// « Ajouter un entretien » : un bouton qui ouvre le formulaire.
export default function FormulaireEntretien({
  voitureId,
  aujourdhui,
}: {
  voitureId: string;
  aujourdhui: string;
}) {
  const [etat, action, enCours] = useActionState(ajouterEntretien, {});
  const [ouvert, setOuvert] = useState(false);

  // Les champs sont gardés ici pour ne pas être vidés après un refus.
  const vide = { date_entretien: aujourdhui, travaux: "", garage: "", prix: "", prochain_entretien: "" };
  const [champs, setChamps] = useState(vide);

  // Entretien bien ajouté : on vide et on referme le formulaire.
  useEffect(() => {
    if (etat.succes) {
      setChamps({ ...vide });
      setOuvert(false);
    }
  }, [etat]);

  const champ = (nom: keyof typeof champs) => ({
    name: nom,
    value: champs[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setChamps({ ...champs, [nom]: e.target.value }),
  });

  if (!ouvert) {
    return (
      <>
        <button className="bouton" type="button" onClick={() => setOuvert(true)}>
          Ajouter un entretien
        </button>
        <MessagePassager etat={etat} />
      </>
    );
  }

  return (
    <form action={action} className="formulaire panneau">
      <input type="hidden" name="voiture_id" value={voitureId} />
      <label className="champ">
        Date de l&apos;entretien
        <input type="date" max={aujourdhui} required {...champ("date_entretien")} />
      </label>
      <label className="champ">
        Ce qui a été fait
        <textarea
          rows={2}
          maxLength={500}
          required
          placeholder="Ex. : vidange, filtres, plaquettes avant"
          {...champ("travaux")}
        />
      </label>
      <label className="champ">
        Garage (facultatif)
        <input placeholder="Ex. : Garage du Centre" maxLength={120} {...champ("garage")} />
      </label>
      <label className="champ">
        Prix en euros (facultatif)
        <input inputMode="decimal" placeholder="Ex. : 89,90" maxLength={12} {...champ("prix")} />
      </label>
      <label className="champ">
        Prochain entretien (facultatif)
        <input type="date" min={champs.date_entretien} {...champ("prochain_entretien")} />
      </label>
      <p className="aide">
        Si tu remplis le prochain entretien, sa date est mise à jour sur la fiche de la voiture.
      </p>
      <div className="boutons">
        <button className="bouton bouton-petit" type="submit" disabled={enCours}>
          {enCours ? "Enregistrement..." : "Enregistrer l'entretien"}
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
