import { seDeconnecter } from "@/app/actions";

// Connecté, mais ce compte n'est rattaché à aucune auto-école.
export default function PageCompteInconnu() {
  return (
    <main className="page">
      <section className="carte">
        <h2>Compte non rattaché</h2>
        <p>
          Ce compte n&apos;est rattaché à aucune auto-école. Demande au
          secrétariat de ton auto-école de t&apos;inviter.
        </p>
      </section>
      <form action={seDeconnecter} className="formulaire">
        <button className="bouton bouton-secondaire" type="submit">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
