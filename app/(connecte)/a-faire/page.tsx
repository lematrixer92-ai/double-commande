import type { Metadata } from "next";
import Link from "next/link";
import EnDirect from "@/components/EnDirect";
import Plaque from "@/components/Plaque";
import { chargerAFaire, GROUPES, type Groupe } from "@/lib/a-faire";
import { exigerSecretariat } from "@/lib/session";

export const metadata: Metadata = { title: "À faire · Double Commande" };

export default async function PageAFaire() {
  await exigerSecretariat();
  const groupes = await chargerAFaire();
  const total = Object.values(groupes).reduce((n, taches) => n + taches.length, 0);

  return (
    <>
      <EnDirect tables={["voitures"]} />

      <div className="titre-page">
        <h1>À faire</h1>
        <Link href="/accueil" className="lien-bouton">
          Retour
        </Link>
      </div>

      {total === 0 ? (
        <section className="carte">
          <h2>Rien à faire, tout est en ordre</h2>
          <p>Aucune voiture à vérifier, aucune date proche, plein et lavage à jour.</p>
        </section>
      ) : (
        (Object.keys(GROUPES) as Groupe[]).map(
          (groupe) =>
            groupes[groupe].length > 0 && (
              <section key={groupe} className={`carte a-faire-groupe a-faire-${groupe}`}>
                <h2>
                  {GROUPES[groupe].titre} ({groupes[groupe].length})
                </h2>
                <p className="aide">{GROUPES[groupe].aide}</p>
                <ul className="lignes">
                  {groupes[groupe].map((t) => (
                    <li key={t.cle}>
                      <Link href={`/voitures/${t.voitureId}`} className="ligne tache">
                        <span className={`etiquette etiquette-tache-${t.type}`}>{t.titre}</span>
                        <span className="tache-voiture">
                          <span className="ligne-nom">{t.modele}</span>
                          <Plaque numero={t.immatriculation} />
                        </span>
                        <span className="ligne-detail">{t.detail}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )
      )}

      <p className="aide">
        Les dates apparaissent ici 30 jours avant l&apos;échéance, et le lavage 11 jours après
        le dernier. Touche une ligne pour ouvrir la fiche de la voiture.
      </p>
    </>
  );
}
