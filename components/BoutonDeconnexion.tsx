"use client";

import { useEffect, useState } from "react";
import { seDeconnecter } from "@/app/actions";

/*
  « Se déconnecter » : on retire aussi les notifications de cet appareil,
  pour qu'il ne reçoive plus celles de ce compte.
*/
export default function BoutonDeconnexion() {
  const [endpoint, setEndpoint] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const abonnement = await reg?.pushManager?.getSubscription();
      if (abonnement) setEndpoint(abonnement.endpoint);
    });
  }, []);

  return (
    <form action={seDeconnecter}>
      <input type="hidden" name="endpoint" value={endpoint} />
      <button className="lien-bouton" type="submit">
        Se déconnecter
      </button>
    </form>
  );
}
