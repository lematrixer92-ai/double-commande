"use client";

import { useEffect, useState } from "react";
import type { EtatFormulaire } from "@/lib/erreurs";
import MessageFormulaire from "./MessageFormulaire";

// Comme MessageFormulaire, mais un message de réussite disparaît tout seul
// au bout de quelques secondes. Un refus (en rouge) reste affiché.
export default function MessagePassager({ etat }: { etat: EtatFormulaire }) {
  const [cache, setCache] = useState<EtatFormulaire | null>(null);

  useEffect(() => {
    if (!etat.succes) return;
    const minuteur = setTimeout(() => setCache(etat), 4000);
    return () => clearTimeout(minuteur);
  }, [etat]);

  return cache === etat ? null : <MessageFormulaire etat={etat} />;
}
