import type { Metadata } from "next";
import { exigerSecretariat } from "@/lib/session";
import { cleSecreteReglee, creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/serveur";
import FormulaireInvitation from "./FormulaireInvitation";
import LigneMoniteur from "./LigneMoniteur";

export const metadata: Metadata = { title: "Moniteurs · Double Commande" };

// « Compte activé » ou « Invitation en attente » (si la clé secrète est réglée).
async function statutDuCompte(id: string): Promise<string | null> {
  if (!cleSecreteReglee) return null;
  const { data } = await creerClientAdmin().auth.admin.getUserById(id);
  if (!data.user) return null;
  return data.user.last_sign_in_at ? "Compte activé" : "Invitation en attente";
}

export default async function PageMoniteurs() {
  const moi = await exigerSecretariat();

  // La sécurité de la base ne renvoie que les personnes de mon auto-école.
  const supabase = await creerClientServeur();
  const { data: personnes } = await supabase
    .from("personnes")
    .select("id, prenom, nom, email, role")
    .order("prenom");

  const moniteurs = (personnes ?? []).filter((p) => p.role === "moniteur");
  const secretariat = (personnes ?? []).filter((p) => p.role === "secretariat");
  const statuts = await Promise.all(moniteurs.map((m) => statutDuCompte(m.id)));

  return (
    <>
      <div className="titre-page">
        <h1>Les moniteurs</h1>
      </div>

      <section className="carte">
        <h2>Inviter un moniteur</h2>
        <p>
          Tu obtiens un lien à lui envoyer (SMS, e-mail, WhatsApp). Avec ce
          lien, il choisit son mot de passe.
        </p>
        <FormulaireInvitation />
      </section>

      <section className="carte">
        <h2>
          {moniteurs.length} moniteur{moniteurs.length > 1 ? "s" : ""}
        </h2>
        {moniteurs.length === 0 ? (
          <p>Aucun moniteur pour l&apos;instant.</p>
        ) : (
          <ul className="lignes">
            {moniteurs.map((m, i) => (
              <LigneMoniteur
                key={m.id}
                id={m.id}
                prenom={m.prenom}
                nom={m.nom}
                email={m.email}
                statut={statuts[i]}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="carte">
        <h2>Secrétariat</h2>
        <ul className="lignes">
          {secretariat.map((p) => (
            <li key={p.id} className="ligne">
              <p className="ligne-nom">
                {p.prenom} {p.nom} {p.id === moi.id && "(toi)"}
              </p>
              <p className="ligne-detail">{p.email}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
