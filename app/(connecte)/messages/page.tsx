import type { Metadata } from "next";
import Link from "next/link";
import EnDirect from "@/components/EnDirect";
import PageLarge from "@/components/PageLarge";
import { chargerConversation, chargerConversations } from "@/lib/conversations";
import { quandCourt } from "@/lib/messages";
import { exigerPersonne } from "@/lib/session";
import { creerClientServeur } from "@/lib/supabase/serveur";
import Conversation from "./Conversation";

export const metadata: Metadata = { title: "Messages · Double Commande" };

/*
  Le mini chat.
  - Moniteur : sa conversation avec le secrétariat, directement.
  - Secrétariat : la liste des moniteurs, et la conversation choisie
    (?avec=<moniteur>). Sur ordinateur, les deux côte à côte ; sur
    téléphone, l'une après l'autre.
*/
export default async function PageMessages({
  searchParams,
}: {
  searchParams: Promise<{ avec?: string }>;
}) {
  const moi = await exigerPersonne();

  if (moi.role === "moniteur") {
    const supabase = await creerClientServeur();
    const [messages, personnes] = await Promise.all([
      chargerConversation(moi.id),
      supabase.from("personnes").select("id, prenom"),
    ]);
    const prenoms = Object.fromEntries(
      (personnes.data ?? []).map((p) => [p.id as string, p.prenom as string]),
    );
    return (
      <>
        <div className="titre-page">
          <h1>Messages</h1>
        </div>
        <p className="aide">Ta conversation avec le secrétariat.</p>
        <Conversation
          moniteurId={moi.id}
          moiId={moi.id}
          initiaux={messages}
          prenoms={prenoms}
          vide="Aucun message pour l'instant. Écris au secrétariat ici : il verra ton message tout de suite."
        />
      </>
    );
  }

  // Secrétariat
  const { avec } = await searchParams;
  const { conversations, prenoms } = await chargerConversations();
  const choisie = conversations.find((c) => c.moniteurId === avec) ?? null;
  const messages = choisie ? await chargerConversation(choisie.moniteurId) : [];

  return (
    <>
      <PageLarge />
      {/* La liste se met à jour quand un message arrive. */}
      <EnDirect tables={["messages"]} />

      <div className={`chat ${choisie ? "chat-avec-conversation" : ""}`}>
        <section className="carte chat-liste">
          <h1 className="chat-titre">Messages</h1>
          {conversations.length === 0 ? (
            <p>
              Aucun moniteur pour l&apos;instant. <Link href="/moniteurs">Invite un moniteur</Link>{" "}
              pour pouvoir lui écrire.
            </p>
          ) : (
            <ul className="lignes">
              {conversations.map((c) => (
                <li key={c.moniteurId}>
                  <Link
                    href={`/messages?avec=${c.moniteurId}`}
                    className={`chat-apercu ${c.moniteurId === choisie?.moniteurId ? "chat-apercu-actif" : ""}`}
                    aria-current={c.moniteurId === choisie?.moniteurId ? "page" : undefined}
                  >
                    <span className="chat-apercu-haut">
                      <span className="ligne-nom">
                        {c.prenom} {c.nom}
                      </span>
                      {c.dernier && <span className="chat-apercu-quand">{quandCourt(c.dernier.cree_le)}</span>}
                    </span>
                    <span className="chat-apercu-bas">
                      <span className="chat-apercu-texte">
                        {c.dernier
                          ? `${c.dernier.auteur_id === c.moniteurId ? "" : "Toi : "}${c.dernier.contenu}`
                          : "Aucun message"}
                      </span>
                      {c.nonLus > 0 && (
                        <span className="pastille-nombre" aria-label={`${c.nonLus} non lu${c.nonLus > 1 ? "s" : ""}`}>
                          {c.nonLus}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="carte chat-fil">
          {choisie ? (
            <>
              <div className="chat-fil-haut">
                <Link href="/messages" className="lien-bouton lien-gauche chat-retour">
                  ← Toutes les conversations
                </Link>
                <h2>
                  {choisie.prenom} {choisie.nom}
                </h2>
              </div>
              <Conversation
                key={choisie.moniteurId}
                moniteurId={choisie.moniteurId}
                moiId={moi.id}
                initiaux={messages}
                prenoms={Object.fromEntries(prenoms)}
                vide={`Aucun message avec ${choisie.prenom} pour l'instant.`}
              />
            </>
          ) : (
            <p className="aide chat-vide">Choisis un moniteur dans la liste pour lire ou écrire.</p>
          )}
        </section>
      </div>
    </>
  );
}
