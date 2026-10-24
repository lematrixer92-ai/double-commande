"use client";

import { useCallback, useEffect, useState } from "react";
import MessageFormulaire from "@/components/MessageFormulaire";
import {
  EVENEMENT_INSTALLATION,
  cleEnOctets,
  estInstallee,
  estIphone,
  invitationInstallation,
  notificationsPossibles,
} from "@/lib/appareil";
import type { EtatFormulaire } from "@/lib/erreurs";
import {
  abonnementEstAMoi,
  enregistrerAbonnement,
  envoyerEssai,
  supprimerAbonnement,
} from "./actions";

/*
  Sur CET appareil : installer l'appli, activer ou couper les notifications.
*/

type EtatNotifications =
  | "chargement"
  | "iphone-a-installer" // iPhone : il faut d'abord ajouter l'appli à l'écran d'accueil
  | "non-gere" // navigateur trop ancien
  | "pas-regle" // les clés ne sont pas encore dans Vercel
  | "refuse" // la personne a dit « Bloquer »
  | "inactif"
  | "actif";

export default function AppareilNotifications({
  clePublique,
  secretariat,
}: {
  clePublique: string | null;
  secretariat: boolean;
}) {
  const [iphone, setIphone] = useState(false);
  const [installee, setInstallee] = useState(false);
  const [peutInstaller, setPeutInstaller] = useState(false);
  const [etat, setEtat] = useState<EtatNotifications>("chargement");
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<EtatFormulaire>({});

  const verifier = useCallback(async () => {
    // Sur iPhone, les notifications ne marchent que dans l'appli installée.
    if (estIphone() && !estInstallee()) return setEtat("iphone-a-installer");
    if (!notificationsPossibles()) return setEtat("non-gere");
    if (!clePublique) return setEtat("pas-regle");
    if (Notification.permission === "denied") return setEtat("refuse");
    const reg = await navigator.serviceWorker.getRegistration();
    const abonnement = await reg?.pushManager.getSubscription();
    const aMoi =
      abonnement && Notification.permission === "granted"
        ? await abonnementEstAMoi(abonnement.endpoint)
        : false;
    setEtat(aMoi ? "actif" : "inactif");
  }, [clePublique]);

  useEffect(() => {
    setIphone(estIphone());
    setInstallee(estInstallee());
    const majInstallation = () => {
      setPeutInstaller(Boolean(invitationInstallation()));
      setInstallee(estInstallee());
    };
    majInstallation();
    window.addEventListener(EVENEMENT_INSTALLATION, majInstallation);
    verifier().catch(() => setEtat("non-gere"));
    return () => window.removeEventListener(EVENEMENT_INSTALLATION, majInstallation);
  }, [verifier]);

  async function installer() {
    const invitation = invitationInstallation();
    if (!invitation) return;
    await invitation.prompt();
    const { outcome } = await invitation.userChoice;
    if (outcome === "accepted") setInstallee(true);
  }

  async function activer() {
    if (!clePublique) return;
    setOccupe(true);
    setResultat({});
    try {
      // Le téléphone affiche « Autoriser les notifications ? »
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setEtat(permission === "denied" ? "refuse" : "inactif");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
      const options = { userVisibleOnly: true, applicationServerKey: cleEnOctets(clePublique) };
      let abonnement: PushSubscription;
      try {
        abonnement = await reg.pushManager.subscribe(options);
      } catch {
        // Un ancien abonnement (avec d'anciennes clés) bloque : on le remplace.
        await (await reg.pushManager.getSubscription())?.unsubscribe();
        abonnement = await reg.pushManager.subscribe(options);
      }
      const reponse = await enregistrerAbonnement(abonnement.toJSON() as never);
      if (reponse.erreur) setResultat(reponse);
      else setEtat("actif");
    } catch {
      setResultat({
        erreur: "Impossible : les notifications n'ont pas pu être activées. Réessaie dans un instant.",
      });
    } finally {
      setOccupe(false);
    }
  }

  async function desactiver() {
    setOccupe(true);
    setResultat({});
    const reg = await navigator.serviceWorker.getRegistration();
    const abonnement = await reg?.pushManager.getSubscription();
    if (abonnement) {
      await supprimerAbonnement(abonnement.endpoint);
      await abonnement.unsubscribe();
    }
    setEtat("inactif");
    setResultat({ succes: "Les notifications sont coupées sur cet appareil." });
    setOccupe(false);
  }

  async function essai() {
    setOccupe(true);
    setResultat(await envoyerEssai());
    setOccupe(false);
  }

  return (
    <>
      <section className="carte">
        <h2>Installer l&apos;appli</h2>
        {installee ? (
          <p>C&apos;est fait : Double Commande est installée sur cet appareil.</p>
        ) : iphone ? (
          <>
            <p>Sur iPhone, l&apos;appli s&apos;ajoute depuis Safari :</p>
            <ol className="etapes">
              <li>Ouvre ce site dans <strong>Safari</strong>.</li>
              <li>
                Appuie sur le bouton <strong>Partager</strong> (le carré avec une flèche vers le
                haut), en bas de l&apos;écran.
              </li>
              <li>
                Choisis <strong>« Sur l&apos;écran d&apos;accueil »</strong>, puis{" "}
                <strong>Ajouter</strong>.
              </li>
              <li>
                Ouvre Double Commande depuis la nouvelle <strong>icône</strong> de ton écran
                d&apos;accueil.
              </li>
            </ol>
            <p className="message message-info">
              Sur iPhone, les notifications ne marchent que depuis l&apos;appli ajoutée à
              l&apos;écran d&apos;accueil.
            </p>
          </>
        ) : peutInstaller ? (
          <>
            <p>Ajoute l&apos;icône de Double Commande à ton écran, comme une vraie appli.</p>
            <button className="bouton" type="button" onClick={installer}>
              Installer l&apos;appli
            </button>
          </>
        ) : (
          <p>
            Ouvre le menu du navigateur (les <strong>⋮</strong> ou le bouton{" "}
            <strong>Partager</strong>) et choisis <strong>« Installer l&apos;application »</strong>{" "}
            ou <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
          </p>
        )}
      </section>

      <section className="carte">
        <h2>Notifications sur cet appareil</h2>
        {etat === "chargement" && <p className="aide">Vérification…</p>}

        {etat === "iphone-a-installer" && (
          <p>
            Ajoute d&apos;abord l&apos;appli à l&apos;écran d&apos;accueil (voir ci-dessus), puis
            ouvre-la depuis l&apos;icône : le bouton « Activer les notifications » apparaîtra ici.
          </p>
        )}

        {etat === "non-gere" && (
          <p>
            Ce navigateur ne sait pas recevoir les notifications. Essaie avec Chrome, Edge,
            Firefox ou Safari à jour.
          </p>
        )}

        {etat === "pas-regle" && (
          <p>
            Les notifications ne sont pas encore réglées.{" "}
            {secretariat
              ? "Suis le réglage plus bas (une seule fois pour toute l'auto-école)."
              : "Le secrétariat doit d'abord les régler : réessaie plus tard."}
          </p>
        )}

        {etat === "refuse" && (
          <p>
            Les notifications sont bloquées sur cet appareil. Pour changer d&apos;avis : ouvre les
            <strong> réglages du téléphone</strong> (ou le cadenas à côté de l&apos;adresse du
            site sur ordinateur), puis <strong>Notifications</strong> et{" "}
            <strong>Autoriser</strong>. Reviens ensuite sur cette page.
          </p>
        )}

        {etat === "inactif" && (
          <>
            <p>Reçois une alerte même quand l&apos;appli est fermée.</p>
            <button className="bouton" type="button" onClick={activer} disabled={occupe}>
              {occupe ? "Activation…" : "Activer les notifications"}
            </button>
            <p className="aide">Le téléphone va te demander l&apos;autorisation : appuie sur « Autoriser ».</p>
          </>
        )}

        {etat === "actif" && (
          <>
            <p className="message message-succes">Les notifications sont activées sur cet appareil.</p>
            <div className="boutons">
              <button className="bouton" type="button" onClick={essai} disabled={occupe}>
                M&apos;envoyer une notification d&apos;essai
              </button>
              <button
                className="bouton bouton-secondaire"
                type="button"
                onClick={desactiver}
                disabled={occupe}
              >
                Couper les notifications
              </button>
            </div>
          </>
        )}

        <MessageFormulaire etat={resultat} />
      </section>
    </>
  );
}
