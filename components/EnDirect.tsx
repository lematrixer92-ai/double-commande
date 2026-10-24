"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";

/*
  Mises à jour en direct : dès qu'une voiture ou une carte change
  (prise, rendue, plein, lavage...), la page se recharge toute seule
  sur tous les téléphones. Rien ne s'affiche à l'écran.
*/
export default function EnDirect({ tables }: { tables: string[] }) {
  const router = useRouter();
  const liste = tables.join(",");

  useEffect(() => {
    const supabase = creerClientNavigateur();
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let arrete = false;

    async function ecouter() {
      // Le jeton de connexion : la base n'envoie que ce que j'ai le droit de voir.
      const { data } = await supabase.auth.getSession();
      if (arrete) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      canal = supabase.channel("flotte");
      for (const table of liste.split(",")) {
        canal.on("postgres_changes", { event: "*", schema: "public", table }, () =>
          router.refresh(),
        );
      }
      canal.subscribe();
    }
    ecouter();

    // Quand on revient sur l'appli (téléphone rallumé), on recharge aussi.
    const auRetour = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      arrete = true;
      document.removeEventListener("visibilitychange", auRetour);
      if (canal) supabase.removeChannel(canal);
    };
  }, [liste, router]);

  return null;
}
