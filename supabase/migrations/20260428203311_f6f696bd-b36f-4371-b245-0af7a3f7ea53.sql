CREATE OR REPLACE FUNCTION public.is_valid_cpf(_cpf text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cpf text;
  sum1 int := 0;
  sum2 int := 0;
  d1 int;
  d2 int;
  i int;
BEGIN
  cpf := regexp_replace(COALESCE(_cpf, ''), '[^0-9]', '', 'g');

  IF cpf !~ '^[0-9]{11}$' OR cpf ~ '^([0-9])\1{10}$' THEN
    RETURN false;
  END IF;

  FOR i IN 1..9 LOOP
    sum1 := sum1 + substring(cpf, i, 1)::int * (11 - i);
  END LOOP;
  d1 := (sum1 * 10) % 11;
  IF d1 = 10 THEN d1 := 0; END IF;

  FOR i IN 1..10 LOOP
    sum2 := sum2 + substring(cpf, i, 1)::int * (12 - i);
  END LOOP;
  d2 := (sum2 * 10) % 11;
  IF d2 = 10 THEN d2 := 0; END IF;

  RETURN d1 = substring(cpf, 10, 1)::int AND d2 = substring(cpf, 11, 1)::int;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_cnpj(_cnpj text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  cnpj text;
  weights1 int[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 int[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  sum1 int := 0;
  sum2 int := 0;
  d1 int;
  d2 int;
  i int;
BEGIN
  cnpj := regexp_replace(COALESCE(_cnpj, ''), '[^0-9]', '', 'g');

  IF cnpj !~ '^[0-9]{14}$' OR cnpj ~ '^([0-9])\1{13}$' THEN
    RETURN false;
  END IF;

  FOR i IN 1..12 LOOP
    sum1 := sum1 + substring(cnpj, i, 1)::int * weights1[i];
  END LOOP;
  d1 := sum1 % 11;
  IF d1 < 2 THEN d1 := 0; ELSE d1 := 11 - d1; END IF;

  FOR i IN 1..13 LOOP
    sum2 := sum2 + substring(cnpj, i, 1)::int * weights2[i];
  END LOOP;
  d2 := sum2 % 11;
  IF d2 < 2 THEN d2 := 0; ELSE d2 := 11 - d2; END IF;

  RETURN d1 = substring(cnpj, 13, 1)::int AND d2 = substring(cnpj, 14, 1)::int;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_valid_br_mobile(_phone text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  phone text;
  ddd int;
  suffix8 text;
  suffix9 text;
BEGIN
  phone := regexp_replace(COALESCE(_phone, ''), '[^0-9]', '', 'g');

  IF phone !~ '^[0-9]{11}$' OR phone ~ '^([0-9])\1{10}$' THEN
    RETURN false;
  END IF;

  ddd := substring(phone, 1, 2)::int;
  suffix8 := substring(phone, 4, 8);
  suffix9 := substring(phone, 3, 9);

  IF ddd < 11 OR ddd > 99 THEN
    RETURN false;
  END IF;

  IF substring(phone, 3, 1) <> '9' THEN
    RETURN false;
  END IF;

  IF suffix8 ~ '^([0-9])\1{7}$' OR suffix9 ~ '^([0-9])\1{8}$' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_access_request(_full_name text, _company_name text, _document text, _whatsapp text, _email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request_id UUID;
  _clean_name TEXT;
  _clean_company TEXT;
  _clean_document TEXT;
  _clean_whatsapp TEXT;
  _clean_email TEXT;
BEGIN
  _clean_name := regexp_replace(left(trim(COALESCE(_full_name, '')), 120), '\s+', ' ', 'g');
  _clean_company := left(trim(COALESCE(_company_name, '')), 120);
  _clean_document := regexp_replace(COALESCE(_document, ''), '[^0-9]', '', 'g');
  _clean_whatsapp := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');
  _clean_email := lower(left(trim(COALESCE(_email, '')), 255));

  IF _clean_name !~* '^[A-ZÀ-ÖØ-öø-ÿ]{2,}( [A-ZÀ-ÖØ-öø-ÿ''-]{2,})+$' THEN
    RAISE EXCEPTION 'Informe nome e sobrenome.';
  END IF;

  IF char_length(_clean_company) < 3 THEN
    RAISE EXCEPTION 'Informe o nome da empresa.';
  END IF;

  IF NOT (public.is_valid_cpf(_clean_document) OR public.is_valid_cnpj(_clean_document)) THEN
    RAISE EXCEPTION 'Informe um CPF ou CNPJ válido.';
  END IF;

  IF NOT public.is_valid_br_mobile(_clean_whatsapp) THEN
    RAISE EXCEPTION 'Informe um WhatsApp válido.';
  END IF;

  IF _clean_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Informe um e-mail válido.';
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