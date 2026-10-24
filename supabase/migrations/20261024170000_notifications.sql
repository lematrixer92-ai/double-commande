-- Double Commande — étape 7 : les notifications
-- Un « abonnement » = un téléphone ou un ordinateur qui accepte les notifications.
-- Seul le serveur du site (clé secrète) lit et écrit cette table : aucune règle d'accès pour les comptes.
-- Un moniteur supprimé perd aussi ses abonnements.
create table public.abonnements_push (
  id bigint generated always as identity primary key,
  personne_id uuid not null references public.personnes (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  cree_le timestamptz not null default now()
);
create index on public.abonnements_push (personne_id);
alter table public.abonnements_push enable row level security;
revoke all on public.abonnements_push from anon, authenticated;
