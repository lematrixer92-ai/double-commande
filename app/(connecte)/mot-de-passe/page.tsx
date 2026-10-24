import type { Metadata } from "next";
import FormulaireMotDePasse from "./FormulaireMotDePasse";

export const metadata: Metadata = { title: "Mot de passe · Double Commande" };

export default async function PageMotDePasse({
  searchParams,
}: {
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { nouveau } = await searchParams;

  return (
    <section className="carte">
      <h2>{nouveau ? "Choisis ton mot de passe" : "Changer mon mot de passe"}</h2>
      {nouveau && (
        <p>Tu t&apos;en serviras avec ton adresse e-mail pour te connecter.</p>
      )}
      <FormulaireMotDePasse />
    </section>
  );
}
