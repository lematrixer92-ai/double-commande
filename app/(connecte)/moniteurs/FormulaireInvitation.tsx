"use client";

import { useActionState, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import { inviterMoniteur } from "./actions";
import PartageLien from "./PartageLien";

export default function FormulaireInvitation() {
  const [champs, setChamps] = useState({ prenom: "", nom: "", email: "" });

  // Après une invitation réussie, on vide le formulaire pour la suivante.
  const [etat, action, enCours] = useActionState(
    async (precedent: Parameters<typeof inviterMoniteur>[0], formulaire: FormData) => {
      const resultat = await inviterMoniteur(precedent, formulaire);
      if (resultat.lien) setChamps({ prenom: "", nom: "", email: "" });
      return resultat;
    },
    {},
  );

  const champ = (nom: keyof typeof champs) => ({
    name: nom,
    value: champs[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setChamps({ ...champs, [nom]: e.target.value }),
  });

  return (
    <form action={action} className="formulaire">
      <label className="champ">
        Prénom
        <input {...champ("prenom")} autoComplete="off" required />
      </label>
      <label className="champ">
        Nom (facultatif)
        <input {...champ("nom")} autoComplete="off" />
      </label>
      <label className="champ">
        Adresse e-mail
        <input
          {...champ("email")}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="off"
          required
        />
      </label>

      <button className="bouton" type="submit" disabled={enCours}>
        {enCours ? "Création..." : "Inviter ce moniteur"}
      </button>

      <MessageFormulaire etat={etat} />
      {etat.lien && <PartageLien lien={etat.lien} prenom={etat.prenom} />}
    </form>
  );
}
