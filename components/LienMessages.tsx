"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";

/*
  Le lien « Messages » en haut de chaque page, avec une pastille orange
  quand des messages ne sont pas encore lus. Elle se met à jour en direct.
*/
export default function LienMessages({ nonLusAuDepart }: { nonLusAuDepart: number }) {
  const [nonLus, setNonLus] = useState(nonLusAuDepart);

  useEffect(() => setNonLus(nonLusAuDepart), [nonLusAuDepart]);

  useEffect(() => {
    const supabase = creerClientNavigateur();
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let arrete = false;

    async function compter() {
      const { data } = await supabase.rpc("messages_non_lus");
      if (arrete || !data) return;
      setNonLus((data as { nombre: number }[]).reduce((total, l) => total + l.nombre, 0));
    }

    async function ecouter() {
      const { data } = await supabase.auth.getSession();
      if (arrete) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      canal = supabase
        .channel("messages-non-lus")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, compter)
        .subscribe();
    }
    ecouter();

    const auRetour = () => {
      if (document.visibilityState === "visible") compter();
    };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      arrete = true;
      document.removeEventListener("visibilitychange", auRetour);
      if (canal) supabase.removeChannel(canal);
    };
  }, []);

  return (
    <Link href="/messages" className="entete-messages">
      Messages
      {nonLus > 0 && (
        <span className="pastille-nombre" aria-label={`${nonLus} non lu${nonLus > 1 ? "s" : ""}`}>
          {nonLus}
        </span>
      )}
    </Link>
  );
}
