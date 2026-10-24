import Logo from "@/components/Logo";

export default function Accueil() {
  return (
    <main className="page">
      <div className="marque">
        <Logo taille={112} />
        <h1 className="nom">double commande</h1>
        <p className="accroche">La flotte de l&apos;auto-école, sans oubli</p>
      </div>

      <section className="carte">
        <h2>Bientôt dans l&apos;appli</h2>
        <p>Toutes les voitures de l&apos;auto-école, en un coup d&apos;œil.</p>
        <ul className="liste">
          <li>
            <span className="pastille pastille-libre" aria-hidden="true" />
            Prendre et rendre une voiture
          </li>
          <li>
            <span className="pastille pastille-accent" aria-hidden="true" />
            Les cartes du parking, le plein, le lavage
          </li>
          <li>
            <span className="pastille pastille-erreur" aria-hidden="true" />
            Les alertes : contrôle technique, assurance, entretien
          </li>
        </ul>
      </section>

      <button className="bouton" type="button" disabled>
        Se connecter (bientôt)
      </button>

      <p className="pied">Étape 1 sur 9 : le site est en ligne.</p>
    </main>
  );
}
