"use client";

import { useState } from "react";
import { octetsEnTexte } from "@/lib/appareil";

/*
  Fabrique les clés des notifications, une seule fois pour toute l'auto-école.
  Tout se passe dans ce navigateur : les clés ne sont envoyées nulle part.
  Le secrétariat les colle ensuite dans Vercel.
*/

type Variable = { nom: string; valeur: string; secret: boolean };

async function fabriquer(besoinVapid: boolean, besoinCron: boolean): Promise<Variable[]> {
  const variables: Variable[] = [];
  if (besoinVapid) {
    const paire = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ]);
    const publique = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));
    const privee = await crypto.subtle.exportKey("jwk", paire.privateKey);
    variables.push(
      { nom: "VAPID_PUBLIC_KEY", valeur: octetsEnTexte(publique), secret: false },
      { nom: "VAPID_PRIVATE_KEY", valeur: privee.d ?? "", secret: true },
    );
  }
  if (besoinCron) {
    variables.push({
      nom: "CRON_SECRET",
      valeur: octetsEnTexte(crypto.getRandomValues(new Uint8Array(32))),
      secret: true,
    });
  }
  return variables;
}

function BoutonCopier({ texte, libelle }: { texte: string; libelle: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button
      className="bouton bouton-petit bouton-secondaire"
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setCopie(true);
          setTimeout(() => setCopie(false), 2000);
        } catch {
          setCopie(false);
        }
      }}
    >
      {copie ? "Copié !" : libelle}
    </button>
  );
}

export default function GenerateurCles({
  besoinVapid,
  besoinCron,
}: {
  besoinVapid: boolean;
  besoinCron: boolean;
}) {
  const [variables, setVariables] = useState<Variable[] | null>(null);

  return (
    <div className="generateur">
      {!variables ? (
        <button
          className="bouton"
          type="button"
          onClick={async () => setVariables(await fabriquer(besoinVapid, besoinCron))}
        >
          Fabriquer les clés
        </button>
      ) : (
        <>
          <p className="message message-info">
            Ces clés viennent d&apos;être fabriquées dans ton navigateur. Ne les envoie à
            personne : colle-les seulement dans Vercel. Si tu recharges la page, d&apos;autres
            clés seront fabriquées (pas grave, tant que tu colles les 3 d&apos;une même série).
          </p>
          {variables.map((v) => (
            <div key={v.nom} className="variable">
              <p className="variable-nom">
                <strong>{v.nom}</strong>
                {v.secret && <span className="badge">Sensitive</span>}
              </p>
              <p className="partage-lien">{v.valeur}</p>
              <div className="boutons">
                <BoutonCopier texte={v.nom} libelle="Copier le nom" />
                <BoutonCopier texte={v.valeur} libelle="Copier la valeur" />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
