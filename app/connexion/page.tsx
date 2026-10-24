import type { Metadata } from "next";
import Logo from "@/components/Logo";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion · Double Commande" };

export default function PageConnexion() {
  return (
    <main className="page">
      <div className="marque">
        <Logo taille={80} />
        <h1 className="nom">double commande</h1>
      </div>

      <section className="carte">
        <h2>Connexion</h2>
        <FormulaireConnexion />
      </section>

      <p className="aide">
        Mot de passe oublié, ou pas encore de compte ? Demande un lien au
        secrétariat de ton auto-école.
      </p>
    </main>
  );
}
