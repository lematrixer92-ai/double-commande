"use client";

import { useState } from "react";

// Le lien à envoyer au moniteur, avec « Partager » (SMS, e-mail, WhatsApp...)
// et « Copier ».
export default function PartageLien({ lien, prenom }: { lien: string; prenom?: string }) {
  const [copie, setCopie] = useState(false);
  const texte = `Bonjour${prenom ? ` ${prenom}` : ""}, voici ton lien pour te connecter à Double Commande (l'appli des voitures de l'auto-école) :`;

  async function partager() {
    try {
      await navigator.share({ title: "Double Commande", text: texte, url: lien });
    } catch {
      // partage annulé ou impossible : on garde le bouton « Copier »
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(`${texte} ${lien}`);
      setCopie(true);
    } catch {
      setCopie(false);
    }
  }

  return (
    <div className="partage">
      <p className="partage-lien">{lien}</p>
      <div className="boutons">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button className="bouton" type="button" onClick={partager}>
            Envoyer le lien
          </button>
        )}
        <button className="bouton bouton-secondaire" type="button" onClick={copier}>
          {copie ? "Copié !" : "Copier le lien"}
        </button>
      </div>
      <p className="aide">
        Le lien ne marche qu&apos;une fois et expire vite : envoie-le tout de
        suite. S&apos;il ne marche plus, appuie sur « Nouveau lien ».
      </p>
    </div>
  );
}
