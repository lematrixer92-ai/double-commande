import type { Metadata } from "next";
import { clePubliqueVapid, notificationsReglees } from "@/lib/notifications";
import { exigerPersonne } from "@/lib/session";
import AppareilNotifications from "./AppareilNotifications";
import GenerateurCles from "./GenerateurCles";

export const metadata: Metadata = { title: "Installer et notifications · Double Commande" };

export default async function PageNotifications() {
  const moi = await exigerPersonne();
  const secretariat = moi.role === "secretariat";
  const rappelsRegles = Boolean(process.env.CRON_SECRET);

  return (
    <>
      <div className="titre-page">
        <h1>Installer et notifications</h1>
      </div>

      <AppareilNotifications clePublique={clePubliqueVapid()} secretariat={secretariat} />

      <section className="carte">
        <h2>Ce que tu reçois</h2>
        <ul className="etapes">
          {secretariat ? (
            <>
              <li>Un nouveau message d&apos;un moniteur dans le chat.</li>
              <li>Un problème signalé sur une voiture.</li>
              <li>Un plein à faire.</li>
              <li>
                Chaque matin, si un contrôle technique, une assurance ou un entretien arrive dans
                30 jours, dans 7 jours, demain ou aujourd&apos;hui (puis chaque semaine tant que
                la date est dépassée).
              </li>
            </>
          ) : (
            <li>Un nouveau message du secrétariat dans le chat.</li>
          )}
        </ul>
        <p className="aide">
          Les notifications arrivent sur chaque appareil où tu les as activées. En te
          déconnectant, cet appareil ne les reçoit plus.
        </p>
      </section>

      {secretariat && (!notificationsReglees || !rappelsRegles) && (
        <section className="carte">
          <h2>Régler les notifications (une seule fois)</h2>
          <p>
            Il manque {notificationsReglees ? "le mot de passe du rappel quotidien" : "les clés des notifications"}{" "}
            dans Vercel. Fais-le de préférence sur ordinateur :
          </p>
          <ol className="etapes">
            <li>Appuie sur « Fabriquer les clés ».</li>
            <li>
              Dans un autre onglet, ouvre <strong>Vercel</strong>, ton projet, puis{" "}
              <strong>Settings</strong> et <strong>Environment Variables</strong>.
            </li>
            <li>
              Pour chaque ligne ci-dessous : <strong>Add</strong> (ou « Add Environment
              Variable »), colle le nom dans <strong>Key</strong> et la valeur dans{" "}
              <strong>Value</strong>. Si la ligne porte l&apos;étiquette « Sensitive », active
              l&apos;option <strong>Sensitive</strong>. Puis <strong>Save</strong>.
            </li>
            <li>
              Ouvre <strong>Deployments</strong>, les <strong>⋯</strong> du premier de la liste,
              puis <strong>Redeploy</strong>. Attends 1 à 2 minutes et recharge cette page.
            </li>
          </ol>
          <GenerateurCles besoinVapid={!notificationsReglees} besoinCron={!rappelsRegles} />
        </section>
      )}
    </>
  );
}
