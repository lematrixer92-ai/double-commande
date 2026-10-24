-- =====================================================================
-- Double Commande — étape 6 : le mini chat
--
-- La table des messages existe depuis l'étape 2 (une conversation par
-- moniteur avec le secrétariat). On ajoute seulement « lu » / « pas lu » :
--   - un message du moniteur est « lu » quand le secrétariat l'a ouvert ;
--   - un message du secrétariat est « lu » quand le moniteur l'a ouvert.
-- Personne ne peut modifier ou effacer un message à la main.
-- =====================================================================

alter table public.messages add column lu_le timestamptz;

-- « J'ai ouvert cette conversation » : les messages de l'autre côté
-- passent en « lu ».
create function public.marquer_conversation_lue(p_moniteur uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_ecole uuid := public.verifier_connexion();
  v_moi uuid := auth.uid();
  v_secretariat boolean := public.est_secretariat();
begin
  if not v_secretariat and p_moniteur is distinct from v_moi then
    raise exception 'Impossible : tu ne peux lire que ta conversation avec le secrétariat.';
  end if;
  update public.messages m
  set lu_le = now()
  where m.auto_ecole_id = v_ecole
    and m.moniteur_id = p_moniteur
    and m.lu_le is null
    and case when v_secretariat
             then m.auteur_id = m.moniteur_id                -- écrit par le moniteur
             else m.auteur_id is distinct from m.moniteur_id -- écrit par le secrétariat
        end;
end
$$;

-- Le nombre de messages pas encore lus, conversation par conversation.
-- (La sécurité de la base ne renvoie que mes conversations.)
create function public.messages_non_lus()
returns table (moniteur_id uuid, nombre integer)
language sql stable set search_path = ''
as $$
  select m.moniteur_id, count(*)::integer
  from public.messages m
  where m.lu_le is null
    and case when (select public.est_secretariat())
             then m.auteur_id = m.moniteur_id
             else m.auteur_id is distinct from m.moniteur_id
        end
  group by m.moniteur_id
$$;

revoke execute on function public.marquer_conversation_lue(uuid), public.messages_non_lus()
  from public, anon;
grant execute on function public.marquer_conversation_lue(uuid), public.messages_non_lus()
  to authenticated;
