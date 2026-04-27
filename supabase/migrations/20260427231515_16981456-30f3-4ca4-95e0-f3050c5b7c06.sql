-- Enums
CREATE TYPE public.nps_classification AS ENUM ('detrator', 'neutro', 'promotor');
CREATE TYPE public.response_status AS ENUM ('novo', 'visto', 'resolvido');
CREATE TYPE public.budget_status AS ENUM ('novo', 'contatado', 'orcamento_enviado', 'fechado', 'perdido');
CREATE TYPE public.company_plan AS ENUM ('starter', 'pro', 'premium');
CREATE TYPE public.interest_type AS ENUM ('festa_infantil', 'casamento', 'evento_corporativo', 'servico_para_evento', 'outro');

-- Generic updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles for logged-in customers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  segment TEXT,
  whatsapp TEXT,
  google_reviews_url TEXT,
  responsible_name TEXT,
  login_email TEXT,
  alert_phone TEXT,
  plan public.company_plan NOT NULL DEFAULT 'starter',
  public_panel_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT companies_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT companies_name_length CHECK (char_length(name) BETWEEN 2 AND 120)
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_companies_owner_user_id ON public.companies(owner_user_id);
CREATE INDEX idx_companies_slug ON public.companies(slug);

CREATE POLICY "Owners can view their companies"
ON public.companies
FOR SELECT
TO authenticated
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- NPS responses
CREATE TABLE public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  classification public.nps_classification NOT NULL,
  comment TEXT,
  name TEXT,
  whatsapp TEXT,
  wants_google_review BOOLEAN NOT NULL DEFAULT false,
  redirected_to_google BOOLEAN NOT NULL DEFAULT false,
  status public.response_status NOT NULL DEFAULT 'novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT nps_comment_length CHECK (comment IS NULL OR char_length(comment) <= 1200),
  CONSTRAINT nps_name_length CHECK (name IS NULL OR char_length(name) <= 120),
  CONSTRAINT nps_whatsapp_length CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 32)
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_nps_responses_company_created ON public.nps_responses(company_id, created_at DESC);
CREATE INDEX idx_nps_responses_score ON public.nps_responses(score);

CREATE POLICY "Owners can view company responses"
ON public.nps_responses
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = nps_responses.company_id
    AND c.owner_user_id = auth.uid()
));

CREATE POLICY "Owners can update company response status"
ON public.nps_responses
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = nps_responses.company_id
    AND c.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = nps_responses.company_id
    AND c.owner_user_id = auth.uid()
));

CREATE TRIGGER update_nps_responses_updated_at
BEFORE UPDATE ON public.nps_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Budget requests
CREATE TABLE public.budget_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nps_response_id UUID REFERENCES public.nps_responses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  interest public.interest_type NOT NULL,
  nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  status public.budget_status NOT NULL DEFAULT 'novo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budget_name_length CHECK (char_length(name) BETWEEN 2 AND 120),
  CONSTRAINT budget_whatsapp_length CHECK (char_length(whatsapp) BETWEEN 8 AND 32)
);

ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_budget_requests_company_created ON public.budget_requests(company_id, created_at DESC);
CREATE INDEX idx_budget_requests_status ON public.budget_requests(status);

CREATE POLICY "Owners can view company budget requests"
ON public.budget_requests
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = budget_requests.company_id
    AND c.owner_user_id = auth.uid()
));

CREATE POLICY "Owners can update company budget requests"
ON public.budget_requests
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = budget_requests.company_id
    AND c.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = budget_requests.company_id
    AND c.owner_user_id = auth.uid()
));

CREATE TRIGGER update_budget_requests_updated_at
BEFORE UPDATE ON public.budget_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Webhooks for budget alerts
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Alerta de orçamento',
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT webhook_url_format CHECK (url ~ '^https://'),
  CONSTRAINT webhook_name_length CHECK (char_length(name) BETWEEN 2 AND 120)
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_webhooks_company ON public.webhooks(company_id);

CREATE POLICY "Owners can manage company webhooks"
ON public.webhooks
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = webhooks.company_id
    AND c.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.companies c
  WHERE c.id = webhooks.company_id
    AND c.owner_user_id = auth.uid()
));

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Safe public company lookup
CREATE OR REPLACE FUNCTION public.get_public_company(_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  segment TEXT,
  whatsapp TEXT,
  google_reviews_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.segment, c.whatsapp, c.google_reviews_url
  FROM public.companies c
  WHERE c.slug = _slug
    AND c.is_active = true
  LIMIT 1;
$$;

-- Public NPS submission without exposing tables
CREATE OR REPLACE FUNCTION public.submit_nps_response(
  _company_slug TEXT,
  _score INTEGER,
  _comment TEXT DEFAULT NULL,
  _name TEXT DEFAULT NULL,
  _whatsapp TEXT DEFAULT NULL,
  _wants_google_review BOOLEAN DEFAULT false,
  _redirected_to_google BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _classification public.nps_classification;
  _response_id UUID;
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
    NULLIF(left(regexp_replace(COALESCE(_whatsapp, ''), '[^0-9+]', '', 'g'), 32), ''),
    COALESCE(_wants_google_review, false),
    COALESCE(_redirected_to_google, false)
  ) RETURNING id INTO _response_id;

  RETURN _response_id;
END;
$$;

-- Public budget submission without exposing tables
CREATE OR REPLACE FUNCTION public.submit_budget_request(
  _company_slug TEXT,
  _name TEXT,
  _whatsapp TEXT,
  _interest public.interest_type,
  _nps_score INTEGER DEFAULT NULL,
  _nps_response_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  _clean_phone := left(regexp_replace(COALESCE(_whatsapp, ''), '[^0-9+]', '', 'g'), 32);

  IF char_length(_clean_name) < 2 OR char_length(_clean_phone) < 8 THEN
    RAISE EXCEPTION 'Dados de contato inválidos';
  END IF;

  INSERT INTO public.budget_requests (
    company_id, nps_response_id, name, whatsapp, interest, nps_score
  ) VALUES (
    _company_id, _nps_response_id, _clean_name, _clean_phone, _interest, _nps_score
  ) RETURNING id INTO _budget_id;

  RETURN _budget_id;
END;
$$;

-- Public metrics panel with token, no personal data
CREATE OR REPLACE FUNCTION public.get_public_panel_metrics(
  _slug TEXT,
  _token TEXT,
  _month DATE DEFAULT NULL
)
RETURNS TABLE (
  company_name TEXT,
  nps NUMERIC,
  total_responses BIGINT,
  budget_requests BIGINT,
  negative_feedbacks BIGINT,
  google_redirects BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    FROM public.nps_responses r
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
    COALESCE(
      ROUND(
        ((COUNT(*) FILTER (WHERE fr.score >= 8)::numeric - COUNT(*) FILTER (WHERE fr.score <= 7)::numeric)
          / NULLIF(COUNT(fr.id), 0)::numeric) * 100,
        1
      ),
      0
    ) AS nps,
    COUNT(fr.id) AS total_responses,
    (SELECT COUNT(*) FROM filtered_budgets) AS budget_requests,
    COUNT(*) FILTER (WHERE fr.score <= 7 AND fr.comment IS NOT NULL) AS negative_feedbacks,
    COUNT(*) FILTER (WHERE fr.redirected_to_google = true OR fr.wants_google_review = true) AS google_redirects
  FROM target_company c
  LEFT JOIN filtered_responses fr ON true
  GROUP BY c.name;
$$;

-- Optional webhook alert trigger using pg_net when available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_budget_webhooks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  hook RECORD;
  company_name TEXT;
  payload JSONB;
BEGIN
  SELECT name INTO company_name FROM public.companies WHERE id = NEW.company_id;

  payload := jsonb_build_object(
    'empresa', company_name,
    'nome_lead', NEW.name,
    'whatsapp', NEW.whatsapp,
    'interesse', NEW.interest,
    'nota', NEW.nps_score,
    'data', NEW.created_at,
    'mensagem', 'Novo pedido de orçamento:' || chr(10) ||
      'Nome: ' || NEW.name || chr(10) ||
      'WhatsApp: ' || NEW.whatsapp || chr(10) ||
      'Interesse: ' || NEW.interest || chr(10) ||
      'Nota: ' || COALESCE(NEW.nps_score::text, '-') || chr(10) ||
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

-- Logo storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company logos are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);