ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS initial_review_question TEXT NOT NULL DEFAULT 'Como foi sua experiência hoje?';

DROP FUNCTION IF EXISTS public.get_public_company(text);

CREATE FUNCTION public.get_public_company(_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  logo_url text,
  segment text,
  whatsapp text,
  google_reviews_url text,
  initial_review_question text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.segment,
    c.whatsapp,
    c.google_reviews_url,
    c.initial_review_question
  FROM public.companies c
  WHERE c.slug = _slug
    AND c.is_active = true
  LIMIT 1;
$function$;