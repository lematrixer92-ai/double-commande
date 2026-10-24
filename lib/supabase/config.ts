/*
  L'adresse et la clé publique de Supabase.
  Elles ne sont JAMAIS écrites ici : elles viennent des variables
  d'environnement (Vercel > Settings > Environment Variables, ou le
  fichier .env.local sur l'ordinateur).
  La clé « publishable » est faite pour être utilisée par le site :
  la sécurité est assurée par les règles de la base (RLS).
*/
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// (l'ancienne clé « anon » marche aussi)
const cle =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigure = Boolean(url && cle);

export function urlSupabase() {
  if (!url) throw new Error("La variable NEXT_PUBLIC_SUPABASE_URL n'est pas réglée.");
  return url;
}

export function cleSupabase() {
  if (!cle) throw new Error("La clé publique Supabase n'est pas réglée.");
  return cle;
}
