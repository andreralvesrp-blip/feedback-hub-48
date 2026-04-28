CREATE OR REPLACE FUNCTION public.get_public_panel_metrics(_slug text, _token text, _month date DEFAULT NULL::date)
RETURNS TABLE(company_name text, experience_index numeric, total_responses bigint, loved_count bigint, ok_count bigint, improve_count bigint, budget_requests bigint, feedbacks bigint, google_redirects bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH target_company AS (
    SELECT id, name
    FROM public.companies
    WHERE slug = _slug
      AND public_panel_token = _token
      AND is_active = true
    LIMIT 1
  ), filtered_responses AS (
    SELECT r.*
    FROM public.experience_responses r
    JOIN target_company c ON c.id = r.company_id
    WHERE _month IS NULL
       OR (r.created_at >= date_trunc('month', _month::timestamp)
       AND r.created_at < date_trunc('month', _month::timestamp) + interval '1 month')
  ), filtered_budgets AS (
    SELECT b.*
    FROM public.budget_requests b
    JOIN target_company c ON c.id = b.company_id
    WHERE _month IS NULL
       OR (b.created_at >= date_trunc('month', _month::timestamp)
       AND b.created_at < date_trunc('month', _month::timestamp) + interval '1 month')
  )
  SELECT
    c.name AS company_name,
    COALESCE(ROUND(
      (
        (COUNT(*) FILTER (WHERE fr.experience_rating = 'loved')::numeric / NULLIF(COUNT(fr.id), 0)::numeric) -
        (COUNT(*) FILTER (WHERE fr.experience_rating = 'improve')::numeric / NULLIF(COUNT(fr.id), 0)::numeric)
      ),
      2
    ), 0) AS experience_index,
    COUNT(fr.id) AS total_responses,
    COUNT(*) FILTER (WHERE fr.experience_rating = 'loved') AS loved_count,
    COUNT(*) FILTER (WHERE fr.experience_rating = 'ok') AS ok_count,
    COUNT(*) FILTER (WHERE fr.experience_rating = 'improve') AS improve_count,
    (SELECT COUNT(*) FROM filtered_budgets) AS budget_requests,
    COUNT(*) FILTER (WHERE fr.comment IS NOT NULL) AS feedbacks,
    COUNT(*) FILTER (WHERE fr.redirected_to_google = true OR fr.wants_google_review = true) AS google_redirects
  FROM target_company c
  LEFT JOIN filtered_responses fr ON true
  GROUP BY c.name;
$function$;