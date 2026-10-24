import type { Metadata } from "next";
import Link from "next/link";
import EnDirect from "@/components/EnDirect";
import {
  aujourdhui,
  chargerFlotte,
  depuisQuand,
  etatLavage,
  etatVoiture,
  type Voiture,
} from "@/lib/flotte";
import { exigerPersonne } from "@/lib/session";
import FicheVoiture from "./FicheVoiture";
import LigneCarteBlanche from "./LigneCarteBlanche";

export const metadata: Metadata = { title: "Voitures · Double Commande" };

export default async function PageVoitures() {
  const moi = await exigerPersonne();
  const secretariat = moi.role === "secretariat";
  const { voitures, cartes, prenoms } = await chargerFlotte();

  const prenom = (id: string | null) => (id === moi.id ? "toi" : prenoms.get(id ?? "") ?? "quelqu'un");

  function phraseEtat(v: Voiture) {
    if (v.indisponible) return v.raison_indisponible ?? "";
    if (v.pris_par) return `avec ${prenom(v.pris_par)} ${depuisQuand(v.pris_depuis)}`;
    if (v.a_verifier) return "un problème a été signalé";
    return "";
  }

  // Ma voiture en premier, puis les autres dans l'ordre.
  const triees = [...voitures].sort(
    (a, b) => Number(b.pris_par === moi.id) - Number(a.pris_par === moi.id),
  );
  const jour = aujourdhui();

  return (
    <>
      <EnDirect tables={["voitures", "cartes"]} />

      <div className="titre-page">
        <h1>Les voitures</h1>
      </div>

      <section className="carte">
        <h2>Cartes blanches du parking</h2>
        {cartes.length === 0 ? (
          <p>Aucune carte pour l&apos;instant.</p>
        ) : (
          <ul className="lignes">
            {cartes.map((c) => (
              <LigneCarteBlanche
                key={c.id}
                id={c.id}
                nom={c.nom}
                libre={!c.pris_par}
                aMoi={c.pris_par === moi.id}
                secretariat={secretariat}
                phraseEtat={
                  c.pris_par
                    ? `Chez ${prenom(c.pris_par)} ${depuisQuand(c.pris_depuis)}`
                    : "Disponible"
                }
              />
            ))}
          </ul>
        )}
      </section>

      {secretariat && (
        <Link href="/voitures/nouvelle" className="bouton">
          Ajouter une voiture
        </Link>
      )}

      {voitures.length === 0 ? (
        <section className="carte">
          <h2>Aucune voiture pour l&apos;instant</h2>
          <p>
            {secretariat
              ? "Appuie sur « Ajouter une voiture » pour créer la première."
              : "Le secrétariat n'a pas encore ajouté de voiture."}
          </p>
        </section>
      ) : (
        <ul className="voitures">
          {triees.map((v) => (
            <FicheVoiture
              key={v.id}
              id={v.id}
              modele={v.modele}
              immatriculation={v.immatriculation}
              boite={v.boite}
              etat={etatVoiture(v)}
              phraseEtat={phraseEtat(v)}
              probleme={v.probleme}
              pleinAFaire={v.plein_a_faire}
              lavage={etatLavage(v.dernier_lavage)}
              laveeAujourdhui={v.dernier_lavage === jour}
              aMoi={v.pris_par === moi.id}
              secretariat={secretariat}
            />
          ))}
        </ul>
      )}
    </>
  );
}
