import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnDirect from "@/components/EnDirect";
import ListeHistorique from "@/components/ListeHistorique";
import {
  aujourdhui,
  chargerFlotte,
  dateCourte,
  echeance,
  etatLavage,
  etatVoiture,
  phraseEtat,
} from "@/lib/flotte";
import { chargerHistorique } from "@/lib/historique";
import { exigerSecretariat } from "@/lib/session";
import { creerClientServeur } from "@/lib/supabase/serveur";
import FicheVoiture from "../FicheVoiture";
import FormulaireEntretien from "../FormulaireEntretien";
import FormulaireVoiture from "../FormulaireVoiture";

export const metadata: Metadata = { title: "Fiche voiture · Double Commande" };

type Entretien = {
  id: string;
  date_entretien: string;
  travaux: string;
  garage: string | null;
  prix: number | null;
  prochain_entretien: string | null;
};

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default async function PageFicheVoiture({ params }: { params: Promise<{ id: string }> }) {
  const moi = await exigerSecretariat();
  const { id } = await params;
  // Une adresse qui n'est pas un identifiant de voiture : page « introuvable ».
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await creerClientServeur();
  const [{ voitures, prenoms }, entretiens, historique] = await Promise.all([
    chargerFlotte(),
    supabase
      .from("entretiens")
      .select("id, date_entretien, travaux, garage, prix, prochain_entretien")
      .eq("voiture_id", id)
      .order("date_entretien", { ascending: false })
      .order("cree_le", { ascending: false }),
    chargerHistorique({ voitureId: id, limite: 20 }),
  ]);
  const voiture = voitures.find((v) => v.id === id);
  if (!voiture) notFound();

  const prenom = (p: string | null) => (p === moi.id ? "toi" : prenoms.get(p ?? "") ?? "quelqu'un");
  const jour = aujourdhui();
  const lavage = etatLavage(voiture.dernier_lavage);
  const listeEntretiens = (entretiens.data ?? []) as Entretien[];

  const dates = [
    { nom: "Contrôle technique", ...echeance(voiture.controle_technique) },
    { nom: "Fin de l'assurance", ...echeance(voiture.fin_assurance) },
    { nom: "Prochain entretien", ...echeance(voiture.prochain_entretien) },
  ];

  return (
    <>
      <EnDirect tables={["voitures", "evenements"]} />

      <div className="titre-page">
        <h1>{voiture.modele}</h1>
        <Link href="/voitures" className="lien-bouton">
          Retour
        </Link>
      </div>

      <ul className="voitures">
        <FicheVoiture
          id={voiture.id}
          modele={voiture.modele}
          immatriculation={voiture.immatriculation}
          boite={voiture.boite}
          etat={etatVoiture(voiture)}
          phraseEtat={phraseEtat(voiture, prenom)}
          probleme={voiture.probleme}
          pleinAFaire={voiture.plein_a_faire}
          lavage={lavage}
          laveeAujourdhui={voiture.dernier_lavage === jour}
          aMoi={false}
          secretariat
          surSaFiche
        />
      </ul>

      <section className="carte">
        <h2>Les dates</h2>
        <ul className="lignes">
          {dates.map((d) => (
            <li key={d.nom} className={`ligne date date-${d.niveau}`}>
              <p className="ligne-nom">{d.nom}</p>
              <p className="ligne-detail">
                {d.niveau === "vide" ? "Pas encore renseignée : ajoute-la dans « Modifier la fiche »." : d.texte}
              </p>
            </li>
          ))}
          <li className={`ligne date ${lavage.aFaire ? "date-bientot" : "date-ok"}`}>
            <p className="ligne-nom">Lavage (tous les 11 jours)</p>
            <p className="ligne-detail">{lavage.texte}</p>
          </li>
        </ul>
      </section>

      <section className="carte">
        <h2>Entretiens</h2>
        <FormulaireEntretien voitureId={voiture.id} aujourdhui={jour} />
        {listeEntretiens.length === 0 ? (
          <p className="aide espace-haut">Aucun entretien noté pour l&apos;instant.</p>
        ) : (
          <ul className="lignes">
            {listeEntretiens.map((e) => (
              <li key={e.id} className="ligne">
                <p className="ligne-nom">
                  {dateCourte(e.date_entretien)} · {e.travaux}
                </p>
                <p className="ligne-detail">
                  {[e.garage, e.prix !== null ? euros.format(e.prix) : null]
                    .filter(Boolean)
                    .join(" · ") || "Garage et prix non notés"}
                </p>
                {e.prochain_entretien && (
                  <p className="ligne-detail">
                    Prochain prévu le {dateCourte(e.prochain_entretien)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="carte">
        <h2>Historique de la voiture</h2>
        <ListeHistorique evenements={historique.evenements} avecVoiture={false} />
        {historique.encore && (
          <Link href="/historique" className="lien-bouton">
            Voir tout l&apos;historique
          </Link>
        )}
      </section>

      <details className="carte replie">
        <summary>Modifier la fiche</summary>
        <FormulaireVoiture voiture={voiture} />
      </details>
    </>
  );
}
