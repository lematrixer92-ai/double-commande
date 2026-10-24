import type { Metadata } from "next";
import Logo from "@/components/Logo";
import BoutonContinuer from "./BoutonContinuer";

export const metadata: Metadata = { title: "Bienvenue · Double Commande" };

/*
  Page ouverte par le lien d'invitation (ou le lien « nouveau mot de passe »).
  On demande d'appuyer sur un bouton au lieu d'utiliser le lien tout de suite :
  certaines messageries ouvrent les liens toutes seules pour les vérifier,
  ce qui « userait » le lien avant que la personne l'ouvre.
*/
export default async function PageBienvenue({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const { token_hash: jeton = "", type = "" } = await searchParams;

  return (
    <main className="page">
      <div className="marque">
        <Logo taille={80} />
        <h1 className="nom">double commande</h1>
        <p className="accroche">La flotte de l&apos;auto-école, sans oubli</p>
      </div>

      <section className="carte">
        <h2>Bienvenue !</h2>
        <p>
          Ton auto-école t&apos;a ouvert un compte. Choisis ton mot de passe
          pour te connecter.
        </p>
        <BoutonContinuer jeton={jeton} type={type} />
      </section>
    </main>
  );
}
