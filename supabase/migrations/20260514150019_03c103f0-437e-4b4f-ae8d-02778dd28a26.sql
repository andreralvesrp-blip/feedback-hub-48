-- Visão consolidada de empresas para super admin (somente leitura)
CREATE OR REPLACE FUNCTION public.get_admin_companies_overview()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  created_at timestamptz,
  alert_phone text,
  google_reviews_url text,
  initial_review_question text,
  responses_count bigint,
  leads_count bigint,
  users_count bigint,
  google_clicks_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.created_at,
    c.alert_phone,
    COALESCE(c.review_google_url, c.google_reviews_url) AS google_reviews_url,
    COALESCE(c.initial_question, c.initial_review_question) AS initial_review_question,
    (SELECT COUNT(*) FROM public.experience_responses r WHERE r.company_id = c.id) AS responses_count,
    (SELECT COUNT(*) FROM public.budget_requests b WHERE b.company_id = c.id) AS leads_count,
    (SELECT COUNT(*) FROM public.user_companies uc WHERE uc.company_id = c.id) AS users_count,
    (SELECT COUNT(*) FROM public.experience_responses r WHERE r.company_id = c.id AND (r.redirected_to_google = true OR r.wants_google_review = true)) AS google_clicks_count
  FROM public.companies c
  WHERE public.is_super_admin(auth.uid())
  ORDER BY c.created_at DESC;
$$;

-- Lista de usuários vinculados a uma empresa (super admin)
CREATE OR REPLACE FUNCTION public.get_admin_company_users(_company_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  role company_user_role,
  linked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uc.user_id, p.email, p.full_name, uc.role, uc.created_at
  FROM public.user_companies uc
  LEFT JOIN public.profiles p ON p.user_id = uc.user_id
  WHERE uc.company_id = _company_id
    AND public.is_super_admin(auth.uid())
  ORDER BY uc.created_at DESC;
$$;