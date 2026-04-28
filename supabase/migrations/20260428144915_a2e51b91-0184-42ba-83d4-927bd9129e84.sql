CREATE OR REPLACE FUNCTION public.get_company_response_months(_company_id uuid)
RETURNS TABLE(month_start date, month_label text)
LANGUAGE sql
STABLE SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT
    date_trunc('month', r.created_at)::date AS month_start,
    CASE EXTRACT(MONTH FROM r.created_at)::int
      WHEN 1 THEN 'Jan'
      WHEN 2 THEN 'Fev'
      WHEN 3 THEN 'Mar'
      WHEN 4 THEN 'Abr'
      WHEN 5 THEN 'Mai'
      WHEN 6 THEN 'Jun'
      WHEN 7 THEN 'Jul'
      WHEN 8 THEN 'Ago'
      WHEN 9 THEN 'Set'
      WHEN 10 THEN 'Out'
      WHEN 11 THEN 'Nov'
      ELSE 'Dez'
    END || '/' || to_char(r.created_at, 'YY') AS month_label
  FROM public.experience_responses r
  JOIN public.companies c ON c.id = r.company_id
  WHERE r.company_id = _company_id
    AND c.owner_user_id = auth.uid()
  ORDER BY month_start DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_company_response_months(uuid) FROM anon;