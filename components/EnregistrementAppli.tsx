"use client";

import { useEffect } from "react";
import { EVENEMENT_INSTALLATION, type InvitationInstallation } from "@/lib/appareil";

/*
  Installe le service worker (pour les notifications et l'installation),
  et garde de côté l'invitation « Installer l'appli » du navigateur.
*/
export default function EnregistrementAppli() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    }

    const garder = (e: Event) => {
      e.preventDefault(); // on l'affichera avec notre bouton
      (window as Window & { __installation?: InvitationInstallation }).__installation =
        e as InvitationInstallation;
      window.dispatchEvent(new Event(EVENEMENT_INSTALLATION));
    };
    const installee = () => {
      delete (window as Window & { __installation?: InvitationInstallation }).__installation;
      window.dispatchEvent(new Event(EVENEMENT_INSTALLATION));
    };
    window.addEventListener("beforeinstallprompt", garder);
    window.addEventListener("appinstalled", installee);
    return () => {
      window.removeEventListener("beforeinstallprompt", garder);
      window.removeEventListener("appinstalled", installee);
    };
  }, []);

  return null;
}
