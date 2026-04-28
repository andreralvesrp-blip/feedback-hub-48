CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_request_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  document TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status public.access_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT access_requests_full_name_length CHECK (char_length(full_name) BETWEEN 2 AND 120),
  CONSTRAINT access_requests_company_name_length CHECK (char_length(company_name) BETWEEN 2 AND 120),
  CONSTRAINT access_requests_document_format CHECK (document ~ '^[0-9]{11}$|^[0-9]{14}$'),
  CONSTRAINT access_requests_whatsapp_format CHECK (whatsapp ~ '^[0-9]{10,13}$'),
  CONSTRAINT access_requests_email_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status_created_at ON public.access_requests (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_requests_pending_email ON public.access_requests (lower(email)) WHERE status = 'pending';

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can view access requests" ON public.access_requests;
CREATE POLICY "Super admins can view access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update access requests" ON public.access_requests;
CREATE POLICY "Super admins can update access requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_access_requests_updated_at ON public.access_requests;
CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.submit_access_request(
  _full_name TEXT,
  _company_name TEXT,
  _document TEXT,
  _whatsapp TEXT,
  _email TEXT,
  _password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
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

  IF char_length(COALESCE(_password, '')) < 6 OR char_length(COALESCE(_password, '')) > 72 THEN
    RAISE EXCEPTION 'A senha precisa ter entre 6 e 72 caracteres';
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
    password_hash,
    status
  ) VALUES (
    _clean_name,
    _clean_company,
    _clean_document,
    _clean_whatsapp,
    _clean_email,
    crypt(_password, gen_salt('bf')),
    'pending'
  ) RETURNING id INTO _request_id;

  RETURN _request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_access_requests()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  company_name TEXT,
  document TEXT,
  whatsapp TEXT,
  email TEXT,
  status public.access_request_status,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ar.id, ar.full_name, ar.company_name, ar.document, ar.whatsapp, ar.email, ar.status, ar.created_at
  FROM public.access_requests ar
  WHERE public.is_super_admin(auth.uid())
  ORDER BY ar.created_at DESC;
$$;