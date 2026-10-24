import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chargerVoiture } from "@/lib/flotte";
import { exigerSecretariat } from "@/lib/session";
import FormulaireVoiture from "../FormulaireVoiture";

export const metadata: Metadata = { title: "Fiche voiture · Double Commande" };

export default async function PageFicheVoiture({ params }: { params: Promise<{ id: string }> }) {
  await exigerSecretariat();
  const { id } = await params;
  // Une adresse qui n'est pas un identifiant de voiture : page « introuvable ».
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const voiture = await chargerVoiture(id);
  if (!voiture) notFound();

  return (
    <>
      <div className="titre-page">
        <h1>{voiture.modele}</h1>
        <Link href="/voitures" className="lien-bouton">
          Retour
        </Link>
      </div>
      <section className="carte">
        <FormulaireVoiture voiture={voiture} />
      </section>
    </>
  );
}
