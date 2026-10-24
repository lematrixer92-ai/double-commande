import { createClient } from "@supabase/supabase-js";
import { cleSupabase, urlSupabase } from "./config";

export { supabaseConfigure } from "./config";

// Client sans personne connectée (sert au voyant « Base de données »).
export function creerClientSupabase() {
  return createClient(urlSupabase(), cleSupabase(), {
    auth: { persistSession: false },
  });
}
