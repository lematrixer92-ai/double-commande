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
- `lib/supabase.ts` : la connexion à la base de données
- `supabase/migrations/` : la base de données (tables, règles, sécurité)
- `supabase/seed.sql` : les premières données (La Défense Permis, 2 cartes)

## Sécurité

Aucune clé secrète dans le code. Les clés (Supabase, etc.) se mettent dans
Vercel, rubrique « Environment Variables », et en local dans un fichier
`.env.local` qui n'est jamais envoyé sur GitHub.
