-- Double Commande — étape 3 : rattacher un compte au secrétariat
-- 1. Crée d'abord le compte dans Supabase > Authentication > Users > Add user.
-- 2. Ci-dessous, remplace l'adresse e-mail, le prénom et le nom (garde les apostrophes autour).
-- 3. Colle dans SQL Editor et clique sur Run : tu dois voir « Success. 1 row ».
insert into public.personnes (id, auto_ecole_id, prenom, nom, email, role)
select u.id, e.id, 'Prénom', 'Nom', u.email, 'secretariat'
from auth.users u, public.auto_ecoles e
where lower(u.email) = lower('adresse@exemple.fr')
  and e.nom = 'La Défense Permis';
