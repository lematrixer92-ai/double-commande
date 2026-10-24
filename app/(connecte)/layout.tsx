import Link from "next/link";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";
import EnregistrementAppli from "@/components/EnregistrementAppli";
import LienMessages from "@/components/LienMessages";
import Logo from "@/components/Logo";
import { chargerNonLus } from "@/lib/conversations";
import { exigerPersonne } from "@/lib/session";

// Les pages de cette partie demandent d'être connecté.
export const dynamic = "force-dynamic";

export default async function LayoutConnecte({
  children,
}: {
  children: React.ReactNode;
}) {
  const moi = await exigerPersonne();
  const nonLus = [...(await chargerNonLus()).values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <header className="entete">
        <Link href="/accueil" className="entete-marque">
          <Logo taille={36} />
          <span className="entete-ecole">{moi.autoEcoleNom}</span>
        </Link>
        <div className="entete-droite">
          <LienMessages nonLusAuDepart={nonLus} />
          <BoutonDeconnexion />
        </div>
      </header>
      <main className="page page-connectee">{children}</main>
      <EnregistrementAppli />
    </>
  );
}
