import Link from "next/link";
import { nomDuJour, type Evenement } from "@/lib/historique";

// Ce qui demande l'attention du secrétariat est marqué d'une pastille.
const COULEURS: Partial<Record<Evenement["type"], string>> = {
  probleme_signale: "pastille-accent",
  plein_a_faire: "pastille-accent",
  mise_indisponible: "pastille-erreur",
};

// L'historique, groupé par jour, du plus récent au plus ancien.
export default function ListeHistorique({
  evenements,
  avecVoiture = true,
}: {
  evenements: Evenement[];
  // false sur la fiche d'une voiture : inutile de répéter laquelle
  avecVoiture?: boolean;
}) {
  if (evenements.length === 0) {
    return <p>Rien pour l&apos;instant.</p>;
  }

  const jours: { jour: string; evenements: Evenement[] }[] = [];
  for (const e of evenements) {
    const dernier = jours.at(-1);
    if (dernier?.jour === e.jour) dernier.evenements.push(e);
    else jours.push({ jour: e.jour, evenements: [e] });
  }

  return (
    <div className="historique">
      {jours.map(({ jour, evenements }) => (
        <section key={jour}>
          <h3 className="historique-jour">{nomDuJour(jour)}</h3>
          <ul className="lignes">
            {evenements.map((e) => (
              <li key={e.id} className="ligne historique-ligne">
                <p className="ligne-nom">
                  <span className={`pastille ${COULEURS[e.type] ?? "pastille-libre"}`} />
                  {e.titre}
                  {avecVoiture && e.objet && (
                    <>
                      {" · "}
                      {e.voitureId ? (
                        <Link href={`/voitures/${e.voitureId}`}>{e.objet}</Link>
                      ) : (
                        e.objet
                      )}
                    </>
                  )}
                  {avecVoiture && e.immatriculation && (
                    <span className="historique-immat"> {e.immatriculation}</span>
                  )}
                </p>
                <p className="ligne-detail">
                  {e.heure}
                  {e.qui ? ` · par ${e.qui}` : ""}
                </p>
                {e.details && <p className="ligne-detail historique-details">{e.details}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
