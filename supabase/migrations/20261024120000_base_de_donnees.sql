-- =====================================================================
-- Double Commande — étape 2 : la base de données
--
-- À coller une seule fois dans Supabase > SQL Editor, puis « Run ».
--
-- Ce fichier crée :
--   1. les tables (auto-écoles, personnes, voitures, cartes, entretiens,
--      événements = historique, messages = mini chat) ;
--   2. les règles vérifiées par la base (pas seulement par l'appli) ;
--   3. la sécurité : une auto-école ne voit jamais les données d'une autre ;
--   4. les actions de l'appli (« Je prends cette voiture », etc.) avec des
--      messages d'erreur clairs en français ;
--   5. la liste « À faire » du secrétariat.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Les listes de valeurs possibles
-- ---------------------------------------------------------------------

create type public.role_personne as enum ('secretariat', 'moniteur');

create type public.type_boite as enum ('manuelle', 'automatique');

create type public.type_evenement as enum (
  'voiture_prise',
  'voiture_rendue',
  'carte_prise',
  'carte_rendue',
  'probleme_signale',
  'plein_a_faire',
  'plein_fait',
  'lavage',
  'mise_indisponible',
  'remise_en_service',
  'entretien'
);


-- ---------------------------------------------------------------------
-- 1. Les tables
-- ---------------------------------------------------------------------

-- Une auto-école cliente (ex. : La Défense Permis).
create table public.auto_ecoles (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(trim(nom)) > 0),
  -- RGPD : au bout de combien de jours on efface messages et historique
  duree_conservation_jours integer not null default 365
    check (duree_conservation_jours between 30 and 3650),
  cree_le timestamptz not null default now()
);

-- Une personne = un compte de connexion (secrétariat ou moniteur).
-- Son id est celui du compte Supabase (auth.users).
create table public.personnes (
  id uuid primary key references auth.users (id) on delete cascade,
  auto_ecole_id uuid not null references public.auto_ecoles (id) on delete cascade,
  prenom text not null check (length(trim(prenom)) > 0),
  nom text not null default '',
  email text not null,
  role public.role_personne not null default 'moniteur',
  cree_le timestamptz not null default now(),
  -- sert aux liens « même auto-école » ci-dessous
  unique (id, auto_ecole_id)
);
create index on public.personnes (auto_ecole_id);


-- Petites fonctions utilisées partout ---------------------------------

-- L'auto-école de la personne connectée (ou rien si personne n'est connecté).
create function public.mon_auto_ecole()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select auto_ecole_id from public.personnes where id = (select auth.uid())
$$;

-- Vrai si la personne connectée fait partie du secrétariat.
create function public.est_secretariat()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.personnes
    where id = (select auth.uid()) and role = 'secretariat'
  )
$$;

-- La date du jour en France (le serveur, lui, est à l'heure UTC).
create function public.aujourdhui()
returns date
language sql stable set search_path = ''
as $$
  select (now() at time zone 'Europe/Paris')::date
$$;


-- Une voiture de l'auto-école.
create table public.voitures (
  id uuid primary key default gen_random_uuid(),
  auto_ecole_id uuid not null default public.mon_auto_ecole()
    references public.auto_ecoles (id) on delete cascade,
  modele text not null check (length(trim(modele)) > 0),
  immatriculation text not null check (length(immatriculation) between 4 and 12),
  boite public.type_boite not null default 'manuelle',
  controle_technique date,      -- prochain contrôle technique
  fin_assurance date,
  prochain_entretien date,
  dernier_lavage date,
  plein_a_faire boolean not null default false,
  a_verifier boolean not null default false,
  probleme text,                -- dernier problème signalé
  indisponible boolean not null default false,
  raison_indisponible text,
  pris_par uuid,                -- le moniteur qui a la voiture
  pris_depuis timestamptz,
  cree_le timestamptz not null default now(),
  unique (id, auto_ecole_id),
  unique (auto_ecole_id, immatriculation),
  -- celui qui a la voiture est forcément de la même auto-école
  foreign key (pris_par, auto_ecole_id)
    references public.personnes (id, auto_ecole_id) on delete set null (pris_par),
  -- RÈGLE : une voiture indisponible ne peut pas être prise
  constraint voiture_indisponible_non_prise
    check (not (indisponible and pris_par is not null))
);
-- RÈGLE : un moniteur ne peut avoir qu'une voiture à la fois
create unique index une_voiture_par_moniteur
  on public.voitures (pris_par) where pris_par is not null;

-- Les cartes du parking (les 2 cartes blanches).
create table public.cartes (
  id uuid primary key default gen_random_uuid(),
  auto_ecole_id uuid not null default public.mon_auto_ecole()
    references public.auto_ecoles (id) on delete cascade,
  nom text not null check (length(trim(nom)) > 0),
  pris_par uuid,
  pris_depuis timestamptz,
  cree_le timestamptz not null default now(),
  unique (id, auto_ecole_id),
  unique (auto_ecole_id, nom),
  foreign key (pris_par, auto_ecole_id)
    references public.personnes (id, auto_ecole_id) on delete set null (pris_par)
);
-- RÈGLE : un moniteur ne peut avoir qu'une carte à la fois
create unique index une_carte_par_moniteur
  on public.cartes (pris_par) where pris_par is not null;

-- Les entretiens faits au garage.
create table public.entretiens (
  id uuid primary key default gen_random_uuid(),
  auto_ecole_id uuid not null default public.mon_auto_ecole()
    references public.auto_ecoles (id) on delete cascade,
  voiture_id uuid not null,
  date_entretien date not null default public.aujourdhui(),
  travaux text not null check (length(trim(travaux)) > 0),
  garage text,
  prix numeric(10, 2) check (prix >= 0),
  prochain_entretien date,
  cree_le timestamptz not null default now(),
  foreign key (voiture_id, auto_ecole_id)
    references public.voitures (id, auto_ecole_id) on delete cascade
);
create index on public.entretiens (voiture_id);

-- L'historique : tout ce qui se passe sur les voitures et les cartes.
create table public.evenements (
  id bigint generated always as identity primary key,
  auto_ecole_id uuid not null references public.auto_ecoles (id) on delete cascade,
  type public.type_evenement not null,
  voiture_id uuid,
  carte_id uuid,
  personne_id uuid,             -- qui l'a fait (vide si la personne a été supprimée)
  details text,
  cree_le timestamptz not null default now(),
  foreign key (voiture_id, auto_ecole_id)
    references public.voitures (id, auto_ecole_id) on delete cascade,
  foreign key (carte_id, auto_ecole_id)
    references public.cartes (id, auto_ecole_id) on delete cascade,
  foreign key (personne_id, auto_ecole_id)
    references public.personnes (id, auto_ecole_id) on delete set null (personne_id)
);
create index on public.evenements (auto_ecole_id, cree_le desc);
create index on public.evenements (voiture_id);

-- Le mini chat : une conversation par moniteur avec le secrétariat.
create table public.messages (
  id bigint generated always as identity primary key,
  auto_ecole_id uuid not null default public.mon_auto_ecole()
    references public.auto_ecoles (id) on delete cascade,
  moniteur_id uuid not null,    -- la conversation (celle de ce moniteur)
  auteur_id uuid default auth.uid(),
  contenu text not null check (length(trim(contenu)) between 1 and 2000),
  cree_le timestamptz not null default now(),
  foreign key (moniteur_id, auto_ecole_id)
    references public.personnes (id, auto_ecole_id) on delete cascade,
  foreign key (auteur_id, auto_ecole_id)
    references public.personnes (id, auto_ecole_id) on delete set null (auteur_id)
);
create index on public.messages (moniteur_id, cree_le);


-- ---------------------------------------------------------------------
-- 2. Les automatismes (déclencheurs)
-- ---------------------------------------------------------------------

-- Immatriculation toujours en majuscules avec des tirets : « ab 123 cd » -> « AB-123-CD ».
create function public.normaliser_immatriculation()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.immatriculation := upper(regexp_replace(trim(new.immatriculation), '[\s.]+', '-', 'g'));
  return new;
end
$$;

create trigger normaliser_immatriculation
  before insert or update of immatriculation on public.voitures
  for each row execute function public.normaliser_immatriculation();

-- RÈGLE : un moniteur supprimé rend automatiquement sa voiture et sa carte
-- (et c'est noté dans l'historique).
create function public.rendre_tout_avant_suppression()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- si c'est toute l'auto-école qui est supprimée, rien à noter
  if not exists (select 1 from public.auto_ecoles where id = old.auto_ecole_id) then
    return old;
  end if;

  insert into public.evenements (auto_ecole_id, type, voiture_id, details)
  select auto_ecole_id, 'voiture_rendue', id,
         'Rendue automatiquement : le compte de ' || old.prenom || ' a été supprimé'
  from public.voitures where pris_par = old.id;

  insert into public.evenements (auto_ecole_id, type, carte_id, details)
  select auto_ecole_id, 'carte_rendue', id,
         'Rendue automatiquement : le compte de ' || old.prenom || ' a été supprimé'
  from public.cartes where pris_par = old.id;

  update public.voitures set pris_par = null, pris_depuis = null where pris_par = old.id;
  update public.cartes set pris_par = null, pris_depuis = null where pris_par = old.id;
  return old;
end
$$;

create trigger rendre_tout_avant_suppression
  before delete on public.personnes
  for each row execute function public.rendre_tout_avant_suppression();

-- Un entretien ajouté met à jour la date du prochain entretien de la voiture
-- et s'inscrit dans l'historique.
create function public.apres_ajout_entretien()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.prochain_entretien is not null then
    update public.voitures set prochain_entretien = new.prochain_entretien
    where id = new.voiture_id;
  end if;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id, details)
  values (new.auto_ecole_id, 'entretien', new.voiture_id, (select auth.uid()),
          new.travaux || coalesce(' — ' || new.garage, ''));
  return new;
end
$$;

create trigger apres_ajout_entretien
  after insert on public.entretiens
  for each row execute function public.apres_ajout_entretien();


-- ---------------------------------------------------------------------
-- 3. La sécurité
--
-- Principe : on ferme tout, puis on ouvre seulement ce qui est utile.
--   - Les visiteurs non connectés (anon) ne voient rien.
--   - Les personnes connectées ne voient que leur auto-école (RLS).
--   - Les changements d'état (prendre, rendre, indisponible...) passent
--     uniquement par les actions de la partie 4, qui vérifient les règles.
-- ---------------------------------------------------------------------

alter table public.auto_ecoles enable row level security;
alter table public.personnes   enable row level security;
alter table public.voitures    enable row level security;
alter table public.cartes      enable row level security;
alter table public.entretiens  enable row level security;
alter table public.evenements  enable row level security;
alter table public.messages    enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;

-- Ce que le secrétariat peut écrire directement (les fiches).
-- Les colonnes d'état (pris_par, indisponible, plein_a_faire...) n'y sont pas.
grant update (nom) on public.auto_ecoles to authenticated;
grant update (prenom, nom) on public.personnes to authenticated;
grant insert (modele, immatriculation, boite, controle_technique, fin_assurance,
              prochain_entretien, dernier_lavage),
      update (modele, immatriculation, boite, controle_technique, fin_assurance,
              prochain_entretien, dernier_lavage),
      delete
  on public.voitures to authenticated;
grant insert (nom), update (nom), delete on public.cartes to authenticated;
grant insert (voiture_id, date_entretien, travaux, garage, prix, prochain_entretien),
      update (date_entretien, travaux, garage, prix, prochain_entretien),
      delete
  on public.entretiens to authenticated;
grant insert (moniteur_id, contenu) on public.messages to authenticated;

-- Auto-école : on voit la sienne, seul le secrétariat change son nom.
create policy "voir son auto-école" on public.auto_ecoles
  for select to authenticated
  using (id = (select public.mon_auto_ecole()));
create policy "secrétariat modifie son auto-école" on public.auto_ecoles
  for update to authenticated
  using (id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));

-- Personnes : on voit les collègues de son auto-école.
-- On peut corriger son propre nom ; le secrétariat peut corriger tout le monde.
create policy "voir ses collègues" on public.personnes
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()));
create policy "modifier un nom" on public.personnes
  for update to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole())
         and (id = (select auth.uid()) or (select public.est_secretariat())));

-- Voitures, cartes, entretiens : tout le monde voit, le secrétariat gère.
create policy "voir les voitures" on public.voitures
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()));
create policy "secrétariat ajoute une voiture" on public.voitures
  for insert to authenticated
  with check (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat modifie une voiture" on public.voitures
  for update to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat supprime une voiture" on public.voitures
  for delete to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));

create policy "voir les cartes" on public.cartes
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()));
create policy "secrétariat ajoute une carte" on public.cartes
  for insert to authenticated
  with check (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat modifie une carte" on public.cartes
  for update to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat supprime une carte" on public.cartes
  for delete to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));

create policy "voir les entretiens" on public.entretiens
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()));
create policy "secrétariat ajoute un entretien" on public.entretiens
  for insert to authenticated
  with check (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat modifie un entretien" on public.entretiens
  for update to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));
create policy "secrétariat supprime un entretien" on public.entretiens
  for delete to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole()) and (select public.est_secretariat()));

-- Historique : le secrétariat voit tout, un moniteur voit ce qu'il a fait.
-- Personne ne l'écrit directement : seules les actions de la partie 4 le remplissent.
create policy "voir l'historique" on public.evenements
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole())
         and ((select public.est_secretariat()) or personne_id = (select auth.uid())));

-- Mini chat : un moniteur ne voit que sa conversation ; le secrétariat voit
-- toutes celles de son auto-école.
create policy "voir les messages" on public.messages
  for select to authenticated
  using (auto_ecole_id = (select public.mon_auto_ecole())
         and ((select public.est_secretariat()) or moniteur_id = (select auth.uid())));
create policy "écrire un message" on public.messages
  for insert to authenticated
  with check (
    auteur_id = (select auth.uid())
    and auto_ecole_id = (select public.mon_auto_ecole())
    and (moniteur_id = (select auth.uid()) or (select public.est_secretariat()))
    and exists (select 1 from public.personnes p
                where p.id = moniteur_id and p.role = 'moniteur')
  );


-- ---------------------------------------------------------------------
-- 4. Les actions de l'appli
--
-- Chaque bouton de l'appli appelle une de ces fonctions. Elles vérifient
-- les règles et, en cas de refus, renvoient un message clair en français
-- que l'appli affichera en rouge.
--
-- « for update » verrouille la ligne : si deux moniteurs appuient en même
-- temps, le second attend que le premier ait fini, puis voit la voiture
-- déjà prise. Un seul obtient donc la voiture.
-- ---------------------------------------------------------------------

-- Vérifie qu'on est connecté et renvoie son auto-école.
create function public.verifier_connexion()
returns uuid
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_ecole uuid := public.mon_auto_ecole();
begin
  if v_ecole is null then
    raise exception 'Impossible : tu n''es pas connecté.';
  end if;
  return v_ecole;
end
$$;

-- Vérifie qu'on est du secrétariat.
create function public.verifier_secretariat(p_action text)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.est_secretariat() then
    raise exception 'Impossible : seul le secrétariat peut %.', p_action;
  end if;
end
$$;

-- Trouve une voiture de son auto-école et la verrouille.
create function public.voiture_verrouillee(p_voiture uuid)
returns public.voitures
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures;
begin
  select * into v from public.voitures
  where id = p_voiture and auto_ecole_id = public.verifier_connexion()
  for update;
  if not found then
    raise exception 'Impossible : cette voiture n''existe pas (ou plus).';
  end if;
  return v;
end
$$;

-- Le prénom d'une personne (pour les messages d'erreur).
create function public.prenom_de(p_personne uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((select prenom from public.personnes where id = p_personne), 'quelqu''un')
$$;


-- « Je prends cette voiture »
create function public.prendre_voiture(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
  v_moi uuid := auth.uid();
  v_autre text;
begin
  if v.pris_par = v_moi then
    raise exception 'Tu as déjà cette voiture.';
  end if;
  if v.pris_par is not null then
    raise exception 'Impossible : cette voiture est déjà prise par %. Attends qu''elle soit rendue.',
      public.prenom_de(v.pris_par);
  end if;
  if v.indisponible then
    raise exception 'Impossible : cette voiture est indisponible%. Demande au secrétariat.',
      coalesce(' (' || nullif(trim(v.raison_indisponible), '') || ')', '');
  end if;

  select immatriculation into v_autre from public.voitures where pris_par = v_moi;
  if found then
    raise exception 'Impossible : tu as déjà la voiture %. Rends-la avant d''en prendre une autre.', v_autre;
  end if;

  begin
    update public.voitures set pris_par = v_moi, pris_depuis = now() where id = v.id;
  exception when unique_violation then
    -- le même moniteur a pris une autre voiture à la même seconde
    raise exception 'Impossible : tu as déjà une autre voiture. Rends-la avant d''en prendre une autre.';
  end;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id)
  values (v.auto_ecole_id, 'voiture_prise', v.id, v_moi);
end
$$;

-- « Je rends la voiture » (ou le secrétariat la marque rendue si le moniteur a oublié)
create function public.rendre_voiture(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
  v_moi uuid := auth.uid();
begin
  if v.pris_par is null then
    raise exception 'Cette voiture est déjà rendue.';
  end if;
  if v.pris_par <> v_moi and not public.est_secretariat() then
    raise exception 'Impossible : cette voiture est prise par %. Seul % ou le secrétariat peut la rendre.',
      public.prenom_de(v.pris_par), public.prenom_de(v.pris_par);
  end if;

  update public.voitures set pris_par = null, pris_depuis = null where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id, details)
  values (v.auto_ecole_id, 'voiture_rendue', v.id, v_moi,
          case when v.pris_par <> v_moi
               then 'Marquée rendue par le secrétariat (oubli de ' || public.prenom_de(v.pris_par) || ')' end);
end
$$;

-- « Je prends la carte »
create function public.prendre_carte(p_carte uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  c public.cartes;
  v_moi uuid := auth.uid();
  v_autre text;
begin
  select * into c from public.cartes
  where id = p_carte and auto_ecole_id = public.verifier_connexion()
  for update;
  if not found then
    raise exception 'Impossible : cette carte n''existe pas (ou plus).';
  end if;
  if c.pris_par = v_moi then
    raise exception 'Tu as déjà cette carte.';
  end if;
  if c.pris_par is not null then
    raise exception 'Impossible : cette carte est déjà prise par %. Attends qu''elle soit rendue.',
      public.prenom_de(c.pris_par);
  end if;

  select nom into v_autre from public.cartes where pris_par = v_moi;
  if found then
    raise exception 'Impossible : tu as déjà la carte « % ». Rends-la avant d''en prendre une autre.', v_autre;
  end if;

  begin
    update public.cartes set pris_par = v_moi, pris_depuis = now() where id = c.id;
  exception when unique_violation then
    raise exception 'Impossible : tu as déjà une autre carte. Rends-la avant d''en prendre une autre.';
  end;

  insert into public.evenements (auto_ecole_id, type, carte_id, personne_id)
  values (c.auto_ecole_id, 'carte_prise', c.id, v_moi);
end
$$;

-- « Je rends la carte » (ou le secrétariat la marque rendue)
create function public.rendre_carte(p_carte uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  c public.cartes;
  v_moi uuid := auth.uid();
begin
  select * into c from public.cartes
  where id = p_carte and auto_ecole_id = public.verifier_connexion()
  for update;
  if not found then
    raise exception 'Impossible : cette carte n''existe pas (ou plus).';
  end if;
  if c.pris_par is null then
    raise exception 'Cette carte est déjà rendue.';
  end if;
  if c.pris_par <> v_moi and not public.est_secretariat() then
    raise exception 'Impossible : cette carte est prise par %. Seul % ou le secrétariat peut la rendre.',
      public.prenom_de(c.pris_par), public.prenom_de(c.pris_par);
  end if;

  update public.cartes set pris_par = null, pris_depuis = null where id = c.id;

  insert into public.evenements (auto_ecole_id, type, carte_id, personne_id, details)
  values (c.auto_ecole_id, 'carte_rendue', c.id, v_moi,
          case when c.pris_par <> v_moi
               then 'Marquée rendue par le secrétariat (oubli de ' || public.prenom_de(c.pris_par) || ')' end);
end
$$;

-- « Signaler un problème » : la voiture passe « à vérifier ».
create function public.signaler_probleme(p_voiture uuid, p_description text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
  v_texte text := nullif(trim(p_description), '');
begin
  update public.voitures set a_verifier = true, probleme = v_texte where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id, details)
  values (v.auto_ecole_id, 'probleme_signale', v.id, auth.uid(), v_texte);
end
$$;

-- « Il faut faire le plein »
create function public.demander_plein(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
begin
  if v.plein_a_faire then
    return; -- déjà signalé, rien à faire
  end if;
  update public.voitures set plein_a_faire = true where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id)
  values (v.auto_ecole_id, 'plein_a_faire', v.id, auth.uid());
end
$$;

-- « Plein fait »
create function public.plein_fait(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
begin
  update public.voitures set plein_a_faire = false where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id)
  values (v.auto_ecole_id, 'plein_fait', v.id, auth.uid());
end
$$;

-- « Lavée aujourd'hui »
create function public.voiture_lavee(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
begin
  if v.dernier_lavage = public.aujourdhui() then
    return; -- déjà notée lavée aujourd'hui
  end if;
  update public.voitures set dernier_lavage = public.aujourdhui() where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id)
  values (v.auto_ecole_id, 'lavage', v.id, auth.uid());
end
$$;

-- Secrétariat : mettre une voiture indisponible (raison facultative).
-- Si un moniteur l'avait, elle est rendue automatiquement.
create function public.mettre_indisponible(p_voiture uuid, p_raison text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
  v_raison text := nullif(trim(p_raison), '');
begin
  perform public.verifier_secretariat('mettre une voiture indisponible');

  if v.pris_par is not null then
    insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id, details)
    values (v.auto_ecole_id, 'voiture_rendue', v.id, auth.uid(),
            'Rendue automatiquement : mise indisponible (elle était chez '
            || public.prenom_de(v.pris_par) || ')');
  end if;

  update public.voitures
  set indisponible = true, raison_indisponible = v_raison, pris_par = null, pris_depuis = null
  where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id, details)
  values (v.auto_ecole_id, 'mise_indisponible', v.id, auth.uid(), v_raison);
end
$$;

-- Secrétariat : remettre une voiture en service (efface aussi « à vérifier »).
create function public.remettre_en_service(p_voiture uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v public.voitures := public.voiture_verrouillee(p_voiture);
begin
  perform public.verifier_secretariat('remettre une voiture en service');

  update public.voitures
  set indisponible = false, raison_indisponible = null, a_verifier = false, probleme = null
  where id = v.id;

  insert into public.evenements (auto_ecole_id, type, voiture_id, personne_id)
  values (v.auto_ecole_id, 'remise_en_service', v.id, auth.uid());
end
$$;


-- ---------------------------------------------------------------------
-- 5. La liste « À faire » du secrétariat
--
-- RÈGLES : alerte 30 jours avant une échéance (ou si elle est dépassée) ;
-- lavage à faire 11 jours après le dernier lavage.
-- « security_invoker » : la liste respecte la sécurité de la partie 3.
-- ---------------------------------------------------------------------

create view public.liste_a_faire
with (security_invoker = true)
as
select
  v.id as voiture_id,
  v.auto_ecole_id,
  v.modele,
  v.immatriculation,
  t.type,
  t.echeance,
  t.echeance is not null and t.echeance < public.aujourdhui() as en_retard,
  t.details
from public.voitures v
cross join lateral (
  values
    ('indisponible',       null::date,             v.raison_indisponible, v.indisponible),
    ('a_verifier',         null::date,             v.probleme,            v.a_verifier),
    ('plein',              null::date,             null::text,            v.plein_a_faire),
    ('controle_technique', v.controle_technique,   null::text,
       v.controle_technique <= public.aujourdhui() + 30),
    ('assurance',          v.fin_assurance,        null::text,
       v.fin_assurance <= public.aujourdhui() + 30),
    ('entretien',          v.prochain_entretien,   null::text,
       v.prochain_entretien <= public.aujourdhui() + 30),
    ('lavage',             v.dernier_lavage + 11,  null::text,
       v.dernier_lavage is null or v.dernier_lavage + 11 <= public.aujourdhui())
) as t (type, echeance, details, a_faire)
where t.a_faire;

grant select on public.liste_a_faire to authenticated;


-- ---------------------------------------------------------------------
-- 6. RGPD : effacer les vieux messages et le vieil historique
--
-- Efface ce qui est plus vieux que la durée choisie par chaque auto-école
-- (365 jours par défaut). Sera lancé automatiquement chaque nuit plus tard.
-- ---------------------------------------------------------------------

create function public.purger_anciennes_donnees()
returns void
language sql security definer set search_path = ''
as $$
  delete from public.messages m
  using public.auto_ecoles a
  where m.auto_ecole_id = a.id
    and m.cree_le < now() - make_interval(days => a.duree_conservation_jours);

  delete from public.evenements e
  using public.auto_ecoles a
  where e.auto_ecole_id = a.id
    and e.cree_le < now() - make_interval(days => a.duree_conservation_jours);
$$;


-- ---------------------------------------------------------------------
-- 7. Qui peut lancer quelles fonctions
-- ---------------------------------------------------------------------

-- Par défaut, tout le monde pourrait lancer une fonction : on ferme tout.
revoke execute on all functions in schema public from public, anon, authenticated;

-- Utilisées par la sécurité et les valeurs par défaut
grant execute on function public.mon_auto_ecole(), public.est_secretariat(),
  public.aujourdhui() to authenticated;

-- Les boutons de l'appli
grant execute on function
  public.prendre_voiture(uuid),
  public.rendre_voiture(uuid),
  public.prendre_carte(uuid),
  public.rendre_carte(uuid),
  public.signaler_probleme(uuid, text),
  public.demander_plein(uuid),
  public.plein_fait(uuid),
  public.voiture_lavee(uuid),
  public.mettre_indisponible(uuid, text),
  public.remettre_en_service(uuid)
to authenticated;

-- Petite vérification publique pour le site : « la base répond-elle ? »
-- Elle ne renvoie aucune donnée, juste « ok ».
create function public.etat_base()
returns text
language sql stable set search_path = ''
as $$ select 'ok'::text $$;
grant execute on function public.etat_base() to anon, authenticated;


-- ---------------------------------------------------------------------
-- 8. Mises à jour en direct (Realtime)
-- L'appli verra tout de suite quand une voiture est prise ou un message arrive.
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime
      add table public.voitures, public.cartes, public.evenements, public.messages;
  end if;
end
$$;
