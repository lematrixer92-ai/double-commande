"use client";

import { useActionState } from "react";
import MessagePassager from "@/components/MessagePassager";
import { actionCarte } from "./actions";

type Props = {
  id: string;
  nom: string;
  // « Chez Karim depuis 14h05 » ou « Disponible »
  phraseEtat: string;
  libre: boolean;
  aMoi: boolean;
  secretariat: boolean;
};

export default function LigneCarteBlanche({ id, nom, phraseEtat, libre, aMoi, secretariat }: Props) {
  const [etat, action, enCours] = useActionState(actionCarte, {});

  let bouton: { valeur: string; texte: string; classe: string } | null = null;
  if (!secretariat && aMoi) bouton = { valeur: "rendre", texte: "Je rends la carte", classe: "bouton" };
  else if (!secretariat && libre) bouton = { valeur: "prendre", texte: "Je prends la carte", classe: "bouton" };
  else if (secretariat && !libre)
    bouton = { valeur: "rendre", texte: "Marquer rendue", classe: "bouton bouton-secondaire" };

  return (
    <li className={`ligne ${aMoi ? "ligne-a-moi" : ""}`}>
      <div>
        <p className="ligne-nom">{nom}</p>
        <p className="ligne-detail">
          <span
            className={`pastille ${libre ? "pastille-libre" : "pastille-accent"}`}
            aria-hidden="true"
          />{" "}
          {phraseEtat}
        </p>
      </div>
      {bouton && (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <button
            className={bouton.classe}
            type="submit"
            name="action"
            value={bouton.valeur}
            disabled={enCours}
          >
            {bouton.texte}
          </button>
        </form>
      )}
      <MessagePassager etat={etat} />
    </li>
  );
}
