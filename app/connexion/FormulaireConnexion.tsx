"use client";

import { useActionState, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import { seConnecter } from "./actions";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, {});
  // Gardé ici pour ne pas avoir à le retaper après une erreur.
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="formulaire">
      <label className="champ">
        Adresse e-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="champ">
        Mot de passe
        <input
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <MessageFormulaire etat={etat} />

      <button className="bouton" type="submit" disabled={enCours}>
        {enCours ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
