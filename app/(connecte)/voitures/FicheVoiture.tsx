"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import MessagePassager from "@/components/MessagePassager";
import Plaque from "@/components/Plaque";
import type { Etat } from "@/lib/flotte";
import { actionVoiture } from "./actions";

type Props = {
  id: string;
  modele: string;
  immatriculation: string;
  boite: "manuelle" | "automatique";
  etat: Etat;
  // « En leçon avec Karim depuis 14h05 », « Indisponible : pneu crevé »...
  phraseEtat: string;
  probleme: string | null;
  pleinAFaire: boolean;
  lavage: { texte: string; aFaire: boolean };
  laveeAujourdhui: boolean;
  aMoi: boolean;
  secretariat: boolean;
  // true sur la page de la fiche elle-même : pas de lien vers elle
  surSaFiche?: boolean;
};

const ETIQUETTES: Record<Etat, string> = {
  libre: "Libre",
  en_lecon: "En leçon",
  a_verifier: "À vérifier",
  indisponible: "Indisponible",
};

export default function FicheVoiture(p: Props) {
  const [etat, action, enCours] = useActionState(actionVoiture, {});
  // Le panneau ouvert sous la voiture : signaler un problème, ou mettre indisponible.
  const [panneau, setPanneau] = useState<"probleme" | "indisponible" | null>(null);

  const bouton = (valeur: string, texte: string, classe = "bouton") => (
    <button className={classe} type="submit" name="action" value={valeur} disabled={enCours}>
      {texte}
    </button>
  );

  return (
    <li className={`carte voiture voiture-${p.etat} ${p.aMoi ? "voiture-a-moi" : ""}`}>
      <div className="voiture-haut">
        <div>
          <p className="voiture-modele">{p.modele}</p>
          <p className="ligne-detail">
            Boîte {p.boite === "automatique" ? "automatique" : "manuelle"}
          </p>
        </div>
        <Plaque numero={p.immatriculation} />
      </div>

      <p className="voiture-etat">
        <span className={`etiquette etiquette-${p.etat}`}>{ETIQUETTES[p.etat]}</span>
        {p.phraseEtat}
      </p>

      {p.probleme && p.etat !== "indisponible" && (
        <p className="ligne-detail">Problème signalé : {p.probleme}</p>
      )}
      <p className={`ligne-detail ${p.pleinAFaire ? "a-faire" : ""}`}>
        {p.pleinAFaire ? "Essence : plein à faire" : "Essence : OK"}
      </p>
      <p className={`ligne-detail ${p.lavage.aFaire ? "a-faire" : ""}`}>{p.lavage.texte}</p>

      <form action={action} className="voiture-actions">
        <input type="hidden" name="id" value={p.id} />

        {/* Le bouton principal */}
        {!p.secretariat && p.aMoi && bouton("rendre", "Je rends la voiture")}
        {!p.secretariat && p.etat !== "indisponible" && p.etat !== "en_lecon" &&
          bouton("prendre", "Je prends cette voiture")}
        {p.secretariat && p.etat === "en_lecon" &&
          bouton("rendre", "Marquer rendue (oubli du moniteur)", "bouton bouton-secondaire")}

        {/* Les petits boutons */}
        <div className="boutons">
          {p.pleinAFaire
            ? bouton("plein_fait", "Plein fait", "bouton bouton-petit bouton-secondaire")
            : bouton("plein", "Il faut faire le plein", "bouton bouton-petit bouton-secondaire")}
          {!p.laveeAujourdhui &&
            bouton("lavee", "Lavée aujourd'hui", "bouton bouton-petit bouton-secondaire")}
          {panneau !== "probleme" && (
            <button
              className="bouton bouton-petit bouton-secondaire"
              type="button"
              onClick={() => setPanneau("probleme")}
            >
              Signaler un problème
            </button>
          )}
        </div>

        {p.secretariat && (
          <div className="boutons">
            {p.etat === "indisponible"
              ? bouton("en_service", "Remettre en service", "bouton bouton-petit")
              : panneau !== "indisponible" && (
                  <button
                    className="bouton bouton-petit bouton-danger-leger"
                    type="button"
                    onClick={() => setPanneau("indisponible")}
                  >
                    Mettre indisponible
                  </button>
                )}
            {!p.surSaFiche && (
              <Link href={`/voitures/${p.id}`} className="bouton bouton-petit bouton-secondaire">
                Fiche et entretiens
              </Link>
            )}
          </div>
        )}
      </form>

      {panneau && (
        <form
          action={async (formulaire) => {
            await action(formulaire);
            setPanneau(null);
          }}
          className="formulaire panneau"
        >
          <input type="hidden" name="id" value={p.id} />
          <label className="champ">
            {panneau === "probleme"
              ? "Quel est le problème ? (facultatif)"
              : "Pourquoi ? (facultatif)"}
            <textarea
              name="texte"
              rows={2}
              maxLength={300}
              placeholder={panneau === "probleme" ? "Ex. : voyant moteur allumé" : "Ex. : au garage"}
            />
          </label>
          <div className="boutons">
            {panneau === "probleme"
              ? bouton("probleme", "Envoyer au secrétariat", "bouton bouton-petit")
              : bouton("indisponible", "Oui, mettre indisponible", "bouton bouton-petit bouton-danger")}
            <button
              className="bouton bouton-petit bouton-secondaire"
              type="button"
              onClick={() => setPanneau(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <MessagePassager etat={etat} />
    </li>
  );
}
