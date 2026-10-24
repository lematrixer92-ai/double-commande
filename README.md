# Double Commande

La flotte de l'auto-école, sans oubli.

Application web (PWA) pour gérer les voitures, les cartes du parking et les
moniteurs d'une auto-école.

## Lancer le site sur son ordinateur

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Où sont les choses

- `app/globals.css` : les couleurs (définies une seule fois) et le style
- `app/page.tsx` : la page d'accueil
- `components/Logo.tsx` : le logo
- `public/icons/` : les icônes de l'appli
- `lib/supabase/` : la connexion à la base de données (public, connecté, administrateur)
- `lib/session.ts` : qui est connecté, avec quel rôle
- `lib/flotte.ts` : charger les voitures et les cartes, dates et états
- `app/(connecte)/voitures/` : les voitures et les cartes blanches (prendre, rendre, plein, lavage, problème, fiches)
- `components/Plaque.tsx` : la plaque d'immatriculation française
- `components/EnDirect.tsx` : mises à jour en direct (Supabase Realtime)
- `proxy.ts` : garde la session et renvoie vers la connexion si besoin
- `app/connexion`, `app/bienvenue`, `app/(connecte)/` : connexion, lien d'invitation, pages réservées
- `supabase/migrations/` : la base de données (tables, règles, sécurité)
- `supabase/seed.sql` : les premières données (La Défense Permis, 2 cartes)
- `supabase/etape-3-compte-secretariat.sql` : rattacher un compte au secrétariat

## Sécurité

Aucune clé secrète dans le code. Les clés (Supabase, etc.) se mettent dans
Vercel, rubrique « Environment Variables », et en local dans un fichier
`.env.local` qui n'est jamais envoyé sur GitHub.

Variables à régler (Vercel et `.env.local`) :

- `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : publiques ;
- `SUPABASE_SECRET_KEY` : **secrète**, utilisée seulement sur le serveur pour
  inviter et supprimer les moniteurs.
