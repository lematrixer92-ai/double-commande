import type { Metadata } from "next";
import Link from "next/link";
import { exigerPersonne } from "@/lib/session";

export const metadata: Metadata = { title: "Accueil · Double Commande" };

export default async function PageAccueil() {
  const moi = await exigerPersonne();
  const secretariat = moi.role === "secretariat";

  return (
    <>
      <div className="titre-page">
        <h1>Bonjour {moi.prenom} !</h1>
        <p className={`badge ${secretariat ? "badge-secretariat" : ""}`}>
          {secretariat ? "Secrétariat" : "Moniteur"}
        </p>
      </div>

      {secretariat && (
        <Link href="/moniteurs" className="carte carte-lien">
          <h2>Les moniteurs</h2>
          <p>Inviter un moniteur, lui envoyer un nouveau lien, supprimer son compte.</p>
        </Link>
      )}

      <section className="carte">
        <h2>Les voitures et les cartes</h2>
        <p>
          {secretariat
            ? "Bientôt ici : toutes les voitures, les cartes blanches et la liste « À faire »."
            : "Bientôt ici : « Je prends cette voiture », « Je prends la carte », le plein et le lavage."}
        </p>
      </section>

      <Link href="/mot-de-passe" className="bouton bouton-secondaire">
        Changer mon mot de passe
      </Link>

      <p className="pied">Étape 3 sur 9 : la connexion et les rôles.</p>
    </>
  );
}
