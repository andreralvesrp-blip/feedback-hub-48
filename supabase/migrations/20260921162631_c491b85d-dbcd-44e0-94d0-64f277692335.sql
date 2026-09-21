DELETE FROM public.experience_responses WHERE id = 'b0d43527-ef10-467d-96c5-fc049259d75f';

CREATE OR REPLACE FUNCTION public.update_experience_response_details(
  _response_id uuid,
  _company_slug text,
  _comment text DEFAULT NULL,
  _name text DEFAULT NULL,
  _whatsapp text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company_id uuid;
  _clean_phone text;
BEGIN
  SELECT c.id INTO _company_id
  FROM public.companies c
  WHERE c.slug = lower(trim(COALESCE(_company_slug, '')))
    AND c.is_active = true
  LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  _clean_phone := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');

  IF _clean_phone <> '' AND _clean_phone !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'WhatsApp inválido';
  END IF;

  UPDATE public.experience_responses r
  SET comment = COALESCE(NULLIF(left(trim(COALESCE(_comment, '')), 1200), ''), r.comment),
      name = COALESCE(NULLIF(left(trim(COALESCE(_name, '')), 120), ''), r.name),
      whatsapp = COALESCE(NULLIF(_clean_phone, ''), r.whatsapp),
      updated_at = now()
  WHERE r.id = _response_id
    AND r.company_id = _company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resposta não pertence à empresa informada';
  END IF;

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_experience_response_details(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_experience_response_details(uuid, text, text, text, text) TO anon, authenticated, service_role;