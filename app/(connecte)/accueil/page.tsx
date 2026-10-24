import type { Metadata } from "next";
import Link from "next/link";
import PageLarge from "@/components/PageLarge";
import Plaque from "@/components/Plaque";
import { compterAFaire } from "@/lib/a-faire";
import { chargerFlotte, depuisQuand } from "@/lib/flotte";
import { exigerPersonne } from "@/lib/session";

export const metadata: Metadata = { title: "Accueil · Double Commande" };

export default async function PageAccueil() {
  const moi = await exigerPersonne();
  const secretariat = moi.role === "secretariat";
  const [{ voitures, cartes }, aFaire] = await Promise.all([
    chargerFlotte(),
    secretariat ? compterAFaire() : 0,
  ]);
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

      {secretariat && <PageLarge />}

      <div className="tuiles">
        {secretariat && (
          <Link href="/a-faire" className={`carte carte-lien ${aFaire > 0 ? "carte-alerte" : ""}`}>
            <h2>À faire</h2>
            <p>
              {aFaire === 0
                ? "Rien à faire : tout est en ordre."
                : `${aFaire} chose${aFaire > 1 ? "s" : ""} à faire : voitures à vérifier, dates proches, plein, lavage.`}
            </p>
          </Link>
        )}

        <Link href="/voitures" className="carte carte-lien">
          <h2>{cartes.length > 0 ? "Les voitures et les cartes" : "Les voitures"}</h2>
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

        {secretariat && (
          <Link href="/historique" className="carte carte-lien">
            <h2>Historique</h2>
            <p>Entretiens, problèmes, indisponibilités, lavages, pleins.</p>
          </Link>
        )}
      </div>

      <Link href="/mot-de-passe" className="bouton bouton-secondaire">
        Changer mon mot de passe
      </Link>

      <p className="pied">Étape 5 sur 9 : la vue secrétariat.</p>
    </>
  );
}
