-- =====================================================================
-- Double Commande — premières données
--
-- À coller dans Supabase > SQL Editor APRÈS le fichier
-- migrations/20261024120000_base_de_donnees.sql, puis « Run ».
--
-- Crée l'auto-école La Défense Permis et ses 2 cartes blanches du parking.
-- Les voitures seront ajoutées depuis l'appli par le secrétariat.
-- =====================================================================

with ecole as (
  insert into public.auto_ecoles (nom)
  values ('La Défense Permis')
  returning id
)
insert into public.cartes (auto_ecole_id, nom)
select id, carte.nom
from ecole, (values ('Carte blanche 1'), ('Carte blanche 2')) as carte (nom);
