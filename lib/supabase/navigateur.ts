import { createBrowserClient } from "@supabase/ssr";
import { cleSupabase, urlSupabase } from "./config";

/*
  Client Supabase utilisé dans le téléphone (et pas sur le serveur).
  Il sert seulement à écouter les mises à jour en direct.
  Les règles de sécurité de la base (RLS) s'appliquent aussi ici.
*/
export function creerClientNavigateur() {
  return createBrowserClient(urlSupabase(), cleSupabase());
}
