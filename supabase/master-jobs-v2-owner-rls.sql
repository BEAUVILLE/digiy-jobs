-- MASTER MAÎTRE DIGIY JOBS — V2

alter table public.digiy_jobs_owner_workspaces enable row level security;
alter table public.digiy_jobs_offers_pro enable row level security;
alter table public.digiy_jobs_candidates_pro enable row level security;

-- OFFRES PUBLIQUES : uniquement colonnes non sensibles.
grant select (
  id, workspace_slug, title, sector, city, contract_type, pay, status,
  description, employer_name, country, requirements,
  has_housing, has_family_welcome, published_at, created_at, slug
)
on table public.digiy_jobs_offers_pro to anon;

drop policy if exists "JOBS public reads active offers v2"
on public.digiy_jobs_offers_pro;

create policy "JOBS public reads active offers v2"
on public.digiy_jobs_offers_pro
for select
to anon
using (status = 'active');

-- RECRUTEUR : on retire les droits larges puis on redonne le strict nécessaire.
revoke insert on table public.digiy_jobs_offers_pro from authenticated;
revoke update on table public.digiy_jobs_offers_pro from authenticated;

grant insert (
  workspace_slug, title, sector, city, contract_type, pay, status,
  description, employer_name, country, requirements,
  has_housing, has_family_welcome, contact_phone
)
on table public.digiy_jobs_offers_pro to authenticated;

grant update (
  title, sector, city, contract_type, pay, status, description,
  employer_name, country, requirements, has_housing,
  has_family_welcome, contact_phone, published_at, updated_at
)
on table public.digiy_jobs_offers_pro to authenticated;

-- Lecture propriétaire déjà limitée par les policies workspace existantes.
grant select on table public.digiy_jobs_owner_workspaces to authenticated;
grant select on table public.digiy_jobs_offers_pro to authenticated;
grant select on table public.digiy_jobs_candidates_pro to authenticated;

-- CANDIDATURES : statut + note interne seulement.
revoke update on table public.digiy_jobs_candidates_pro from authenticated;
grant update (status, note, updated_at)
on table public.digiy_jobs_candidates_pro to authenticated;


-- LEGACY HARDENING
-- Ces anciens RPC par slug ne vérifiaient pas l'identité du demandeur.
-- Le MASTER V2 passe désormais par Auth + workspace + RLS.
revoke execute on function public.digiy_jobs_get_bureau_by_slug(text) from anon, authenticated;
revoke execute on function public.digiy_jobs_pro_candidates_by_slug(text) from anon, authenticated;
revoke execute on function public.digiy_jobs_pro_insert_offer(text, jsonb) from anon, authenticated;
revoke execute on function public.digiy_jobs_pro_offers_by_slug(text) from anon, authenticated;
revoke execute on function public.digiy_jobs_pro_update_candidate_status(text, uuid, text) from anon, authenticated;
