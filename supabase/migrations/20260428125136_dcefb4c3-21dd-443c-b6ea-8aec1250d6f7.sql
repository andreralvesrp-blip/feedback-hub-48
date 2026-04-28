CREATE OR REPLACE FUNCTION public.submit_nps_response(_company_slug text, _score integer, _comment text DEFAULT NULL::text, _name text DEFAULT NULL::text, _whatsapp text DEFAULT NULL::text, _wants_google_review boolean DEFAULT false, _redirected_to_google boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _company_id UUID;
  _classification public.nps_classification;
  _response_id UUID;
  _clean_phone TEXT;
BEGIN
  IF _score < 0 OR _score > 10 THEN
    RAISE EXCEPTION 'Nota inválida';
  END IF;

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

  _classification := CASE
    WHEN _score <= 6 THEN 'detrator'::public.nps_classification
    WHEN _score = 7 THEN 'neutro'::public.nps_classification
    ELSE 'promotor'::public.nps_classification
  END;

  INSERT INTO public.nps_responses (
    company_id, score, classification, comment, name, whatsapp, wants_google_review, redirected_to_google
  ) VALUES (
    _company_id,
    _score,
    _classification,
    NULLIF(left(trim(COALESCE(_comment, '')), 1200), ''),
    NULLIF(left(trim(COALESCE(_name, '')), 120), ''),
    NULLIF(_clean_phone, ''),
    COALESCE(_wants_google_review, false),
    COALESCE(_redirected_to_google, false)
  ) RETURNING id INTO _response_id;

  RETURN _response_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_budget_request(_company_slug text, _name text, _whatsapp text, _interest interest_type, _nps_score integer DEFAULT NULL::integer, _nps_response_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    company_id, nps_response_id, name, whatsapp, interest, nps_score
  ) VALUES (
    _company_id, _nps_response_id, _clean_name, _clean_phone, _interest, _nps_score
  ) RETURNING id INTO _budget_id;

  RETURN _budget_id;
END;
$function$;