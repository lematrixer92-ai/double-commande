import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
  Passe avant chaque page :
  1. rafraîchit la session (pour rester connecté sans se reconnecter) ;
  2. renvoie vers la page de connexion si on n'est pas connecté
     et qu'on demande une page réservée.
*/
const PAGES_LIBRES = ["/", "/connexion", "/bienvenue"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !cle) return NextResponse.next({ request });

  let reponse = NextResponse.next({ request });

  const supabase = createServerClient(url, cle, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesAEcrire, entetes) {
        cookiesAEcrire.forEach(({ name, value }) => request.cookies.set(name, value));
        reponse = NextResponse.next({ request });
        cookiesAEcrire.forEach(({ name, value, options }) =>
          reponse.cookies.set(name, value, options),
        );
        Object.entries(entetes).forEach(([nom, valeur]) =>
          reponse.headers.set(nom, valeur),
        );
      },
    },
  });

  const { data } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  if (!data.user && !PAGES_LIBRES.includes(chemin)) {
    const connexion = request.nextUrl.clone();
    connexion.pathname = "/connexion";
    connexion.search = "";
    return NextResponse.redirect(connexion);
  }

  return reponse;
}

export const config = {
  // Toutes les pages, sauf les fichiers (images, icônes, manifeste...)
  matcher: [
    "/((?!_next/static|_next/image|icons/|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
