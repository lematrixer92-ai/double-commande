import Link from "next/link";
import { seDeconnecter } from "@/app/actions";
import Logo from "@/components/Logo";
import { exigerPersonne } from "@/lib/session";

// Les pages de cette partie demandent d'être connecté.
export const dynamic = "force-dynamic";

export default async function LayoutConnecte({
  children,
}: {
  children: React.ReactNode;
}) {
  const moi = await exigerPersonne();

  return (
    <>
      <header className="entete">
        <Link href="/accueil" className="entete-marque">
          <Logo taille={36} />
          <span className="entete-ecole">{moi.autoEcoleNom}</span>
        </Link>
        <form action={seDeconnecter}>
          <button className="lien-bouton" type="submit">
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="page page-connectee">{children}</main>
    </>
  );
}
