DROP FUNCTION IF EXISTS public.submit_access_request(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

ALTER TABLE public.access_requests
DROP COLUMN IF EXISTS password_hash;

CREATE OR REPLACE FUNCTION public.submit_access_request(
  _full_name TEXT,
  _company_name TEXT,
  _document TEXT,
  _whatsapp TEXT,
  _email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _request_id UUID;
  _clean_name TEXT;
  _clean_company TEXT;
  _clean_document TEXT;
  _clean_whatsapp TEXT;
  _clean_email TEXT;
BEGIN
  _clean_name := left(trim(COALESCE(_full_name, '')), 120);
  _clean_company := left(trim(COALESCE(_company_name, '')), 120);
  _clean_document := regexp_replace(COALESCE(_document, ''), '[^0-9]', '', 'g');
  _clean_whatsapp := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');
  _clean_email := lower(left(trim(COALESCE(_email, '')), 255));

  IF char_length(_clean_name) < 2 OR char_length(_clean_company) < 2 THEN
    RAISE EXCEPTION 'Informe nome e empresa válidos';
  END IF;

  IF _clean_document !~ '^[0-9]{11}$|^[0-9]{14}$' THEN
    RAISE EXCEPTION 'CPF ou CNPJ inválido';
  END IF;

  IF _clean_whatsapp !~ '^[0-9]{10,13}$' THEN
    RAISE EXCEPTION 'WhatsApp inválido';
  END IF;

  IF _clean_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.access_requests ar
    WHERE lower(ar.email) = _clean_email
      AND ar.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Já existe uma solicitação pendente para este email';
  END IF;

  INSERT INTO public.access_requests (
    full_name,
    company_name,
    document,
    whatsapp,
    email,
    status
  ) VALUES (
    _clean_name,
    _clean_company,
    _clean_document,
    _clean_whatsapp,
    _clean_email,
    'pending'
  ) RETURNING id INTO _request_id;

  RETURN _request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_access_request(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_access_request(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;