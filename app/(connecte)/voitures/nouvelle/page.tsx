import type { Metadata } from "next";
import Link from "next/link";
import { exigerSecretariat } from "@/lib/session";
import FormulaireVoiture from "../FormulaireVoiture";

export const metadata: Metadata = { title: "Nouvelle voiture · Double Commande" };

export default async function PageNouvelleVoiture() {
  await exigerSecretariat();

  return (
    <>
      <div className="titre-page">
        <h1>Nouvelle voiture</h1>
        <Link href="/voitures" className="lien-bouton">
          Retour
        </Link>
      </div>
      <section className="carte">
        <FormulaireVoiture />
      </section>
    </>
  );
}
