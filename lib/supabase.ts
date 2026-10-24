import { createClient } from "@supabase/supabase-js";

/*
  Connexion à la base Supabase.
  L'adresse et la clé ne sont JAMAIS écrites ici : elles viennent des
  variables d'environnement (Vercel > Settings > Environment Variables,
  ou le fichier .env.local sur l'ordinateur).
  La clé « publishable » est faite pour être utilisée par le site :
  la sécurité est assurée par les règles de la base (RLS).
*/
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cle = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigure = Boolean(url && cle);

export function creerClientSupabase() {
  if (!url || !cle) {
    throw new Error("Les variables Supabase ne sont pas réglées.");
  }
  return createClient(url, cle, { auth: { persistSession: false } });
}
