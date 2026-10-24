import { NextResponse, type NextRequest } from "next/server";
import { aujourdhui, joursEntre } from "@/lib/flotte";
import { notifier, notificationsReglees, secretariatDe } from "@/lib/notifications";
import { creerClientAdmin } from "@/lib/supabase/admin";

/*
  Le rappel quotidien des échéances (contrôle technique, assurance, entretien).
  Vercel appelle cette adresse tous les matins (fichier vercel.json).
  Seul Vercel connaît le mot de passe CRON_SECRET : personne d'autre ne
  peut déclencher le rappel.

  Pour ne pas déranger tous les jours pendant 30 jours, on prévient le
  secrétariat 30 jours avant, 7 jours avant, la veille et le jour même,
  puis chaque semaine tant que la date est dépassée.
*/

export const dynamic = "force-dynamic";

const ECHEANCES = [
  { colonne: "controle_technique", nom: "Contrôle technique" },
  { colonne: "fin_assurance", nom: "Fin de l'assurance" },
  { colonne: "prochain_entretien", nom: "Entretien" },
] as const;

type Voiture = {
  auto_ecole_id: string;
  modele: string;
  controle_technique: string | null;
  fin_assurance: string | null;
  prochain_entretien: string | null;
};

function quand(jours: number): string | null {
  if (jours === 30 || jours === 7) return `dans ${jours} jours`;
  if (jours === 1) return "demain";
  if (jours === 0) return "aujourd'hui";
  if (jours < 0 && -jours % 7 === 0) return `dépassé depuis ${-jours} jours`;
  return null;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 401 });
  }
  if (!notificationsReglees) {
    return NextResponse.json({ envoye: 0, raison: "Notifications pas encore réglées." });
  }

  const { data, error } = await creerClientAdmin()
    .from("voitures")
    .select("auto_ecole_id, modele, controle_technique, fin_assurance, prochain_entretien");
  if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

  // Les phrases à envoyer, auto-école par auto-école.
  const parEcole = new Map<string, string[]>();
  const ceJour = aujourdhui();
  for (const v of (data ?? []) as Voiture[]) {
    for (const e of ECHEANCES) {
      const date = v[e.colonne];
      if (!date) continue;
      const moment = quand(joursEntre(ceJour, date));
      if (!moment) continue;
      const phrases = parEcole.get(v.auto_ecole_id) ?? [];
      phrases.push(`${e.nom} de la ${v.modele} : ${moment}.`);
      parEcole.set(v.auto_ecole_id, phrases);
    }
  }

  for (const [ecole, phrases] of parEcole) {
    await notifier(await secretariatDe(ecole), {
      titre:
        phrases.length === 1 ? "Une date approche" : `${phrases.length} dates à surveiller`,
      texte: phrases.join("\n"),
      url: "/a-faire",
      tag: "echeances",
    });
  }

  return NextResponse.json({ envoye: parEcole.size });
}
