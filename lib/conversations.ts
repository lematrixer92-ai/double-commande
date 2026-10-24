import { COLONNES_MESSAGE, NOMBRE_MESSAGES, type Message } from "./messages";
import { creerClientServeur } from "./supabase/serveur";

/*
  Le mini chat côté serveur : une conversation par moniteur avec le
  secrétariat. La sécurité de la base ne renvoie que ce que j'ai le droit
  de voir (un moniteur : seulement sa conversation).
*/

// Les derniers messages d'une conversation, du plus ancien au plus récent.
export async function chargerConversation(moniteurId: string): Promise<Message[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("messages")
    .select(COLONNES_MESSAGE)
    .eq("moniteur_id", moniteurId)
    .order("id", { ascending: false })
    .limit(NOMBRE_MESSAGES);
  return ((data ?? []) as Message[]).reverse();
}

// Nombre de messages pas encore lus, par conversation.
export async function chargerNonLus(): Promise<Map<string, number>> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.rpc("messages_non_lus");
  return new Map(
    ((data ?? []) as { moniteur_id: string; nombre: number }[]).map((l) => [
      l.moniteur_id,
      l.nombre,
    ]),
  );
}

export type ApercuConversation = {
  moniteurId: string;
  prenom: string;
  nom: string;
  dernier: Message | null;
  nonLus: number;
};

// Pour le secrétariat : tous les moniteurs, ceux qui ont écrit en dernier
// en haut de la liste.
export async function chargerConversations(): Promise<{
  conversations: ApercuConversation[];
  prenoms: Map<string, string>;
}> {
  const supabase = await creerClientServeur();
  const [personnes, derniers, nonLus] = await Promise.all([
    supabase.from("personnes").select("id, prenom, nom, role").order("prenom"),
    // Assez de messages récents pour trouver le dernier de chaque conversation.
    supabase.from("messages").select(COLONNES_MESSAGE).order("id", { ascending: false }).limit(500),
    chargerNonLus(),
  ]);

  const dernierDe = new Map<string, Message>();
  for (const m of (derniers.data ?? []) as Message[]) {
    if (!dernierDe.has(m.moniteur_id)) dernierDe.set(m.moniteur_id, m);
  }

  const conversations = (personnes.data ?? [])
    .filter((p) => p.role === "moniteur")
    .map((p) => ({
      moniteurId: p.id as string,
      prenom: p.prenom as string,
      nom: p.nom as string,
      dernier: dernierDe.get(p.id) ?? null,
      nonLus: nonLus.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.dernier?.id ?? 0) - (a.dernier?.id ?? 0));

  const prenoms = new Map(
    (personnes.data ?? []).map((p) => [p.id as string, p.prenom as string]),
  );
  return { conversations, prenoms };
}
