"use client";

import Link from "next/link";
import { useActionState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import { changerMotDePasse } from "./actions";

export default function FormulaireMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, {});

  if (etat.succes) {
    return (
      <div className="formulaire">
        <MessageFormulaire etat={etat} />
        <Link href="/accueil" className="bouton">
          Continuer
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="formulaire">
      <label className="champ">
        Nouveau mot de passe (8 caractères minimum)
        <input
          name="mot_de_passe"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="champ">
        Le même, encore une fois
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      <MessageFormulaire etat={etat} />

      <button className="bouton" type="submit" disabled={enCours}>
        {enCours ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
