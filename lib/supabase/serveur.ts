import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cleSupabase, urlSupabase } from "./config";

/*
  Client Supabase « au nom de la personne connectée ».
  La session (qui est connecté) est rangée dans un cookie du navigateur.
  Toutes les règles de sécurité de la base (RLS) s'appliquent.
*/
export async function creerClientServeur() {
  const magasin = await cookies();

  return createServerClient(urlSupabase(), cleSupabase(), {
    cookies: {
      getAll() {
        return magasin.getAll();
      },
      setAll(cookiesAEcrire) {
        try {
          cookiesAEcrire.forEach(({ name, value, options }) =>
            magasin.set(name, value, options),
          );
        } catch {
          // Appelé depuis une page : le fichier proxy.ts s'en charge.
        }
      },
    },
  });
}
