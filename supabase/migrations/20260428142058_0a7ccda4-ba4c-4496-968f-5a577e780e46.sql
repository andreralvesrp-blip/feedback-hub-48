CREATE TYPE public.experience_rating AS ENUM ('loved', 'ok', 'improve');

DROP FUNCTION IF EXISTS public.get_public_panel_metrics(TEXT, TEXT, DATE);
DROP FUNCTION IF EXISTS public.submit_nps_response(TEXT, INTEGER, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.mark_nps_google_review_intent(UUID);
DROP FUNCTION IF EXISTS public.submit_budget_request(TEXT, TEXT, TEXT, public.interest_type, INTEGER, UUID);
DROP TRIGGER IF EXISTS notify_budget_webhooks_after_insert ON public.budget_requests;
DROP TRIGGER IF EXISTS notify_budget_webhooks_trigger ON public.budget_requests;
DROP FUNCTION IF EXISTS public.notify_budget_webhooks();

ALTER TABLE public.nps_responses
ADD COLUMN experience_rating public.experience_rating;

UPDATE public.nps_responses
SET experience_rating = CASE
  WHEN score >= 9 THEN 'loved'::public.experience_rating
  WHEN score >= 7 THEN 'ok'::public.experience_rating
  ELSE 'improve'::public.experience_rating
END;

ALTER TABLE public.nps_responses
ALTER COLUMN experience_rating SET NOT NULL;

ALTER TABLE public.budget_requests
ADD COLUMN experience_response_id UUID,
ADD COLUMN experience_rating public.experience_rating;

UPDATE public.budget_requests
SET experience_response_id = nps_response_id,
    experience_rating = CASE
      WHEN nps_score >= 9 THEN 'loved'::public.experience_rating
      WHEN nps_score >= 7 THEN 'ok'::public.experience_rating
      WHEN nps_score IS NOT NULL THEN 'improve'::public.experience_rating
      ELSE NULL
    END;

ALTER TABLE public.budget_requests DROP CONSTRAINT IF EXISTS budget_requests_nps_response_id_fkey;
ALTER TABLE public.budget_requests DROP COLUMN nps_response_id;
ALTER TABLE public.budget_requests DROP COLUMN nps_score;

ALTER TABLE public.nps_responses DROP COLUMN classification;
ALTER TABLE public.nps_responses DROP COLUMN score;

ALTER TABLE public.nps_responses RENAME TO experience_responses;

ALTER TABLE public.budget_requests
ADD CONSTRAINT budget_requests_experience_response_id_fkey
FOREIGN KEY (experience_response_id) REFERENCES public.experience_responses(id) ON DELETE SET NULL;

ALTER INDEX IF EXISTS public.idx_nps_responses_company_created RENAME TO idx_experience_responses_company_created;
DROP INDEX IF EXISTS public.idx_nps_responses_score;
CREATE INDEX idx_experience_responses_rating ON public.experience_responses(experience_rating);

ALTER TRIGGER update_nps_responses_updated_at ON public.experience_responses RENAME TO update_experience_responses_updated_at;

ALTER POLICY "Owners can view company responses" ON public.experience_responses RENAME TO "Owners can view company experiences";
ALTER POLICY "Owners can update company response status" ON public.experience_responses RENAME TO "Owners can update company experience status";

CREATE OR REPLACE FUNCTION public.submit_experience_response(
  _company_slug TEXT,
  _experience_rating public.experience_rating,
  _comment TEXT DEFAULT NULL,
  _name TEXT DEFAULT NULL,
  _whatsapp TEXT DEFAULT NULL,
  _wants_google_review BOOLEAN DEFAULT false,
  _redirected_to_google BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _response_id UUID;
  _clean_phone TEXT;
BEGIN
  SELECT id INTO _company_id
  FROM public.companies
  WHERE slug = _company_slug AND is_active = true;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  _clean_phone := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');

  IF _clean_phone <> '' AND _clean_phone !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'WhatsApp inválido';
  END IF;

  INSERT INTO public.experience_responses (
    company_id, experience_rating, comment, name, whatsapp, wants_google_review, redirected_to_google
  ) VALUES (
    _company_id,
    _experience_rating,
    NULLIF(left(trim(COALESCE(_comment, '')), 1200), ''),
    NULLIF(left(trim(COALESCE(_name, '')), 120), ''),
    NULLIF(_clean_phone, ''),
    COALESCE(_wants_google_review, false),
    COALESCE(_redirected_to_google, false)
  ) RETURNING id INTO _response_id;

  RETURN _response_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_experience_google_review_intent(_response_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _google_url TEXT;
BEGIN
  IF _response_id IS NULL THEN
    RAISE EXCEPTION 'Resposta inválida';
  END IF;

  SELECT c.google_reviews_url INTO _google_url
  FROM public.experience_responses r
  JOIN public.companies c ON c.id = r.company_id
  WHERE r.id = _response_id
    AND c.is_active = true;

  IF _google_url IS NULL THEN
    RAISE EXCEPTION 'Resposta não encontrada';
  END IF;

  UPDATE public.experience_responses
  SET wants_google_review = true,
      redirected_to_google = true,
      updated_at = now()
  WHERE id = _response_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_budget_request(
  _company_slug TEXT,
  _name TEXT,
  _whatsapp TEXT,
  _interest public.interest_type,
  _experience_rating public.experience_rating DEFAULT NULL,
  _experience_response_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _budget_id UUID;
  _clean_name TEXT;
  _clean_phone TEXT;
BEGIN
  SELECT id INTO _company_id
  FROM public.companies
  WHERE slug = _company_slug AND is_active = true;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  _clean_name := left(trim(COALESCE(_name, '')), 120);
  _clean_phone := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');

  IF char_length(_clean_name) < 2 OR _clean_phone !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'Dados de contato inválidos';
  END IF;

  INSERT INTO public.budget_requests (
    company_id, experience_response_id, name, whatsapp, interest, experience_rating
  ) VALUES (
    _company_id, _experience_response_id, _clean_name, _clean_phone, _interest, _experience_rating
  ) RETURNING id INTO _budget_id;

  RETURN _budget_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_panel_metrics(_slug TEXT, _token TEXT, _month DATE DEFAULT NULL::date)
RETURNS TABLE(
  company_name TEXT,
  experience_index NUMERIC,
  total_responses BIGINT,
  loved_count BIGINT,
  ok_count BIGINT,
  improve_count BIGINT,
  budget_requests BIGINT,
  feedbacks BIGINT,
  google_redirects BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    COALESCE(ROUND((COUNT(*) FILTER (WHERE fr.experience_rating = 'loved')::numeric / NULLIF(COUNT(fr.id), 0)::numeric) * 100), 0) AS experience_index,
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
$$;

CREATE OR REPLACE FUNCTION public.notify_budget_webhooks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  hook RECORD;
  company_name TEXT;
  payload JSONB;
BEGIN
  SELECT name INTO company_name FROM public.companies WHERE id = NEW.company_id;

  payload := jsonb_build_object(
    'company', company_name,
    'experience_rating', NEW.experience_rating,
    'name', NEW.name,
    'whatsapp', NEW.whatsapp,
    'interest', NEW.interest,
    'created_at', NEW.created_at,
    'message', 'Novo pedido de orçamento:' || chr(10) ||
      'Nome: ' || NEW.name || chr(10) ||
      'WhatsApp: ' || NEW.whatsapp || chr(10) ||
      'Interesse: ' || NEW.interest || chr(10) ||
      'Experiência: ' || COALESCE(NEW.experience_rating::text, '-') || chr(10) ||
      'https://wa.me/' || regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g')
  );

  FOR hook IN
    SELECT url FROM public.webhooks
    WHERE company_id = NEW.company_id AND is_active = true
  LOOP
    PERFORM net.http_post(
      url := hook.url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := payload
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_budget_webhooks_after_insert
AFTER INSERT ON public.budget_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_budget_webhooks();

DROP TYPE public.nps_classification;