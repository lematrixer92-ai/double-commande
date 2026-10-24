import type { Metadata } from "next";
import Link from "next/link";
import EnDirect from "@/components/EnDirect";
import ListeHistorique from "@/components/ListeHistorique";
import { chargerHistorique, FILTRES, type NomFiltre } from "@/lib/historique";
import { exigerSecretariat } from "@/lib/session";

export const metadata: Metadata = { title: "Historique · Double Commande" };

const PAR_PAGE = 50;

export default async function PageHistorique({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; limite?: string }>;
}) {
  await exigerSecretariat();
  const params = await searchParams;
  const filtre: NomFiltre = params.filtre && params.filtre in FILTRES ? (params.filtre as NomFiltre) : "tout";
  const limite = Math.min(Math.max(Number(params.limite) || PAR_PAGE, PAR_PAGE), 1000);

  const { evenements, encore } = await chargerHistorique({
    types: FILTRES[filtre].types,
    limite,
  });

  const lien = (nom: NomFiltre, nouvelleLimite?: number) => {
    const recherche = new URLSearchParams();
    if (nom !== "tout") recherche.set("filtre", nom);
    if (nouvelleLimite) recherche.set("limite", String(nouvelleLimite));
    const texte = recherche.toString();
    return texte ? `/historique?${texte}` : "/historique";
  };

  return (
    <>
      <EnDirect tables={["evenements"]} />

      <div className="titre-page">
        <h1>Historique</h1>
        <Link href="/accueil" className="lien-bouton">
          Retour
        </Link>
      </div>

      <nav className="filtres" aria-label="Filtrer l'historique">
        {(Object.keys(FILTRES) as NomFiltre[]).map((nom) => (
          <Link
            key={nom}
            href={lien(nom)}
            className={`filtre ${nom === filtre ? "filtre-actif" : ""}`}
            aria-current={nom === filtre ? "page" : undefined}
          >
            {FILTRES[nom].nom}
          </Link>
        ))}
      </nav>

      <section className="carte">
        <ListeHistorique evenements={evenements} />
      </section>

      {encore && (
        <Link href={lien(filtre, limite + PAR_PAGE)} className="bouton bouton-secondaire" scroll={false}>
          Voir plus ancien
        </Link>
      )}
    </>
  );
}
