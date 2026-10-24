"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageFormulaire from "@/components/MessageFormulaire";
import { erreurDeLaBase } from "@/lib/erreurs";
import {
  COLONNES_MESSAGE,
  LONGUEUR_MAX,
  NOMBRE_MESSAGES,
  heureDuMessage,
  jourDuMessage,
  nomDuJourMessage,
  vientDuMoniteur,
  type Message,
} from "@/lib/messages";
import { creerClientNavigateur } from "@/lib/supabase/navigateur";
import { notifierNouveauMessage } from "../notifications/actions";

/*
  Une conversation du mini chat, en direct :
  - les nouveaux messages arrivent tout seuls (Supabase Realtime) ;
  - quand la conversation est à l'écran, les messages reçus passent en « lu » ;
  - l'envoi passe par la base, qui vérifie que j'ai le droit d'écrire ici.
*/
export default function Conversation({
  moniteurId,
  moiId,
  initiaux,
  prenoms,
  vide,
}: {
  moniteurId: string;
  moiId: string;
  initiaux: Message[];
  prenoms: Record<string, string>;
  vide: string;
}) {
  const router = useRouter();
  const [supabase] = useState(creerClientNavigateur);
  const [messages, setMessages] = useState(initiaux);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const bas = useRef<HTMLDivElement>(null);

  // Ajoute ou remplace des messages, toujours dans l'ordre.
  const fusionner = useCallback((nouveaux: Message[]) => {
    setMessages((anciens) => {
      const parId = new Map(anciens.map((m) => [m.id, m]));
      for (const m of nouveaux) parId.set(m.id, m);
      return [...parId.values()].sort((a, b) => a.id - b.id).slice(-NOMBRE_MESSAGES);
    });
  }, []);

  // Le serveur a rechargé la page : on reprend ses messages.
  useEffect(() => fusionner(initiaux), [initiaux, fusionner]);

  // « J'ai lu » : seulement si l'appli est à l'écran.
  const marquerLu = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const { error } = await supabase.rpc("marquer_conversation_lue", { p_moniteur: moniteurId });
    if (!error) router.refresh(); // met à jour les pastilles « non lus »
  }, [supabase, moniteurId, router]);

  useEffect(() => {
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let arrete = false;

    // Recharge les derniers messages (par exemple au retour sur l'appli).
    async function recharger() {
      const { data } = await supabase
        .from("messages")
        .select(COLONNES_MESSAGE)
        .eq("moniteur_id", moniteurId)
        .order("id", { ascending: false })
        .limit(NOMBRE_MESSAGES);
      if (!arrete && data) fusionner(data as Message[]);
    }

    async function ecouter() {
      // Le jeton de connexion : la base n'envoie que ce que j'ai le droit de voir.
      const { data } = await supabase.auth.getSession();
      if (arrete) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      canal = supabase
        .channel(`chat-${moniteurId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages", filter: `moniteur_id=eq.${moniteurId}` },
          (changement) => {
            const m = changement.new as Message;
            if (!m?.id) return;
            fusionner([m]);
            if (changement.eventType === "INSERT" && m.auteur_id !== moiId) marquerLu();
          },
        )
        .subscribe();
    }

    ecouter();
    marquerLu();

    const auRetour = () => {
      if (document.visibilityState !== "visible") return;
      recharger();
      marquerLu();
    };
    document.addEventListener("visibilitychange", auRetour);

    return () => {
      arrete = true;
      document.removeEventListener("visibilitychange", auRetour);
      if (canal) supabase.removeChannel(canal);
    };
  }, [supabase, moniteurId, moiId, fusionner, marquerLu]);

  // Toujours voir le dernier message.
  useEffect(() => {
    bas.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function envoyer() {
    const contenu = texte.trim();
    if (!contenu || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const { data, error } = await supabase
      .from("messages")
      .insert({ moniteur_id: moniteurId, contenu })
      .select(COLONNES_MESSAGE)
      .single();
    setEnvoi(false);
    if (error) {
      setErreur(
        error.code === "23514"
          ? `Impossible : le message doit faire entre 1 et ${LONGUEUR_MAX} caractères.`
          : erreurDeLaBase(error),
      );
      return;
    }
    setTexte("");
    fusionner([data as Message]);
    // Notification à l'autre côté (s'il a activé les notifications).
    notifierNouveauMessage((data as Message).id).catch(() => {});
    router.refresh();
  }

  // Sur ordinateur, « Entrée » envoie (Maj + Entrée pour aller à la ligne).
  // Sur téléphone, « Entrée » va à la ligne et on appuie sur « Envoyer ».
  function toucheClavier(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    e.preventDefault();
    envoyer();
  }

  // Le dernier de mes messages, pour afficher « Vu » dessous.
  const monDernier = [...messages].reverse().find((m) => m.auteur_id === moiId);

  return (
    <div className="chat-conversation">
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && <p className="aide chat-vide">{vide}</p>}
        {messages.map((m, i) => {
          const jour = jourDuMessage(m.cree_le);
          const nouveauJour = i === 0 || jourDuMessage(messages[i - 1].cree_le) !== jour;
          const deMoi = m.auteur_id === moiId;
          const precedent = messages[i - 1];
          // Le prénom n'est écrit qu'au premier message d'une suite du même auteur.
          const memeAuteur = !nouveauJour && precedent?.auteur_id === m.auteur_id;
          const auteur = m.auteur_id
            ? prenoms[m.auteur_id] ?? (vientDuMoniteur(m) ? "Moniteur" : "Secrétariat")
            : "Secrétariat";
          return (
            <div key={m.id} className="chat-ligne-groupe">
              {nouveauJour && <p className="chat-jour">{nomDuJourMessage(jour)}</p>}
              <div className={`chat-bulle ${deMoi ? "chat-bulle-moi" : "chat-bulle-autre"}`}>
                {!deMoi && !memeAuteur && <p className="chat-auteur">{auteur}</p>}
                <p className="chat-texte">{m.contenu}</p>
                <p className="chat-heure">
                  {heureDuMessage(m.cree_le)}
                  {m === monDernier && m.lu_le && " · Vu"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bas} />
      </div>

      <form
        className="chat-envoi"
        onSubmit={(e) => {
          e.preventDefault();
          envoyer();
        }}
      >
        {erreur && <MessageFormulaire etat={{ erreur }} />}
        <div className="chat-saisie">
          <label className="sr-only" htmlFor="chat-texte">
            Ton message
          </label>
          <textarea
            id="chat-texte"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={toucheClavier}
            placeholder="Écris ton message…"
            rows={1}
            maxLength={LONGUEUR_MAX}
            required
          />
          <button className="bouton bouton-petit" type="submit" disabled={envoi || !texte.trim()}>
            {envoi ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </form>
    </div>
  );
}
