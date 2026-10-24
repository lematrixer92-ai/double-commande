import { creerClientSupabase, supabaseConfigure } from "@/lib/supabase/public";

// Petit voyant qui dit si le site arrive à parler à la base de données.
export default async function EtatBase() {
  let connectee = false;

  if (supabaseConfigure) {
    const { data } = await creerClientSupabase().rpc("etat_base");
    connectee = data === "ok";
  }

  return (
    <p className="etat-base">
      <span
        className={`pastille ${connectee ? "pastille-libre" : "pastille-erreur"}`}
        aria-hidden="true"
      />
      {connectee
        ? "Base de données : connectée"
        : "Base de données : pas encore connectée"}
    </p>
  );
}
