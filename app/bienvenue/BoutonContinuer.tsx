"use client";

import { useActionState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import { ouvrirLien } from "./actions";

export default function BoutonContinuer({
  jeton,
  type,
}: {
  jeton: string;
  type: string;
}) {
  const [etat, action, enCours] = useActionState(ouvrirLien, {});

  return (
    <form action={action} className="formulaire">
      <input type="hidden" name="token_hash" value={jeton} />
      <input type="hidden" name="type" value={type} />
      <MessageFormulaire etat={etat} />
      <button className="bouton" type="submit" disabled={enCours}>
        {enCours ? "Un instant..." : "Choisir mon mot de passe"}
      </button>
    </form>
  );
}
