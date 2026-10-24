import "server-only";
import { createClient } from "@supabase/supabase-js";
import { urlSupabase } from "./config";

/*
  Client Supabase « administrateur » : il passe outre les règles de la base.
  Il sert uniquement à créer et supprimer des comptes, et seulement après
  avoir vérifié que la demande vient du secrétariat.

  La clé secrète vient de la variable SUPABASE_SECRET_KEY, réglée dans
  Vercel. Elle n'est JAMAIS dans le code, ni sur GitHub, et ne quitte
  jamais le serveur (pas de NEXT_PUBLIC_ devant son nom).
*/
const cleSecrete =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const cleSecreteReglee = Boolean(cleSecrete);

export function creerClientAdmin() {
  if (!cleSecrete) {
    throw new Error("La variable SUPABASE_SECRET_KEY n'est pas réglée dans Vercel.");
  }
  return createClient(urlSupabase(), cleSecrete, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
