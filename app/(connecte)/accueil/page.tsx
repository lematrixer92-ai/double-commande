import type { Metadata } from "next";
import Link from "next/link";
import Plaque from "@/components/Plaque";
import { chargerFlotte, depuisQuand } from "@/lib/flotte";
import { exigerPersonne } from "@/lib/session";

export const metadata: Metadata = { title: "Accueil · Double Commande" };

export default async function PageAccueil() {
  const moi = await exigerPersonne();
  const secretariat = moi.role === "secretariat";
  const { voitures, cartes } = await chargerFlotte();
  const maVoiture = voitures.find((v) => v.pris_par === moi.id);
  const maCarte = cartes.find((c) => c.pris_par === moi.id);
  const libres = voitures.filter((v) => !v.pris_par && !v.indisponible).length;

  return (
    <>
      <div className="titre-page">
        <h1>Bonjour {moi.prenom} !</h1>
        <p className={`badge ${secretariat ? "badge-secretariat" : ""}`}>
          {secretariat ? "Secrétariat" : "Moniteur"}
        </p>
      </div>

      <Link href="/voitures" className="carte carte-lien">
        <h2>Les voitures et les cartes</h2>
        {!secretariat && maVoiture ? (
          <div className="accueil-ma-voiture">
            <p>
              Tu as la {maVoiture.modele} {depuisQuand(maVoiture.pris_depuis)}.
            </p>
            <Plaque numero={maVoiture.immatriculation} />
          </div>
        ) : (
          <p>
            {libres} voiture{libres > 1 ? "s" : ""} libre{libres > 1 ? "s" : ""} sur{" "}
            {voitures.length}.
          </p>
        )}
        {!secretariat && maCarte && <p>Tu as la {maCarte.nom.toLowerCase()}.</p>}
      </Link>

      {secretariat && (
        <Link href="/moniteurs" className="carte carte-lien">
          <h2>Les moniteurs</h2>
          <p>Inviter un moniteur, lui envoyer un nouveau lien, supprimer son compte.</p>
        </Link>
      )}

      <Link href="/mot-de-passe" className="bouton bouton-secondaire">
        Changer mon mot de passe
      </Link>

      <p className="pied">Étape 4 sur 9 : les voitures et les cartes blanches.</p>
    </>
  );
}
