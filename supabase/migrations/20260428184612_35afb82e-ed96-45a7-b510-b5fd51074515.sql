DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_user_role') THEN
    CREATE TYPE public.company_user_role AS ENUM ('super_admin', 'company_admin', 'viewer');
  END IF;
END $$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS review_google_url TEXT,
  ADD COLUMN IF NOT EXISTS initial_question TEXT;

UPDATE public.companies
SET review_google_url = COALESCE(review_google_url, google_reviews_url),
    initial_question = COALESCE(initial_question, initial_review_question);

ALTER TABLE public.companies
  ALTER COLUMN review_google_url SET DEFAULT NULL,
  ALTER COLUMN initial_question SET DEFAULT 'Como foi sua experiência hoje?';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_slug_unique') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_slug_unique UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_initial_question_not_empty') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_initial_question_not_empty CHECK (char_length(trim(initial_question)) >= 5);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.company_user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

INSERT INTO public.user_companies (user_id, company_id, role)
SELECT owner_user_id, id, 'company_admin'::public.company_user_role
FROM public.companies
ON CONFLICT (user_id, company_id) DO NOTHING;

ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_companies uc
    WHERE uc.user_id = _user_id
      AND uc.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _roles public.company_user_role[] DEFAULT ARRAY['super_admin','company_admin','viewer']::public.company_user_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = _user_id
        AND uc.company_id = _company_id
        AND uc.role = ANY(_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_company(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_company_role(_user_id, _company_id, ARRAY['super_admin','company_admin']::public.company_user_role[]);
$$;

DROP POLICY IF EXISTS "Owners can view their companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can create companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update their companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view linked companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can create companies" ON public.companies;
DROP POLICY IF EXISTS "Company admins can update linked companies" ON public.companies;

CREATE POLICY "Users can view linked companies"
ON public.companies
FOR SELECT
TO authenticated
USING (public.has_company_role(auth.uid(), id));

CREATE POLICY "Super admins can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()) OR owner_user_id = auth.uid());

CREATE POLICY "Company admins can update linked companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.can_manage_company(auth.uid(), id))
WITH CHECK (public.can_manage_company(auth.uid(), id));

DROP POLICY IF EXISTS "Owners can view company experiences" ON public.experience_responses;
DROP POLICY IF EXISTS "Owners can update company experience status" ON public.experience_responses;
DROP POLICY IF EXISTS "Linked users can view company experiences" ON public.experience_responses;
DROP POLICY IF EXISTS "Company admins can update company experiences" ON public.experience_responses;

CREATE POLICY "Linked users can view company experiences"
ON public.experience_responses
FOR SELECT
TO authenticated
USING (public.has_company_role(auth.uid(), company_id));

CREATE POLICY "Company admins can update company experiences"
ON public.experience_responses
FOR UPDATE
TO authenticated
USING (public.can_manage_company(auth.uid(), company_id))
WITH CHECK (public.can_manage_company(auth.uid(), company_id));

DROP POLICY IF EXISTS "Owners can view company budget requests" ON public.budget_requests;
DROP POLICY IF EXISTS "Owners can update company budget requests" ON public.budget_requests;
DROP POLICY IF EXISTS "Linked users can view company budget requests" ON public.budget_requests;
DROP POLICY IF EXISTS "Company admins can update company budget requests" ON public.budget_requests;

CREATE POLICY "Linked users can view company budget requests"
ON public.budget_requests
FOR SELECT
TO authenticated
USING (public.has_company_role(auth.uid(), company_id));

CREATE POLICY "Company admins can update company budget requests"
ON public.budget_requests
FOR UPDATE
TO authenticated
USING (public.can_manage_company(auth.uid(), company_id))
WITH CHECK (public.can_manage_company(auth.uid(), company_id));

DROP POLICY IF EXISTS "Owners can manage company webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Company admins can manage company webhooks" ON public.webhooks;

CREATE POLICY "Company admins can manage company webhooks"
ON public.webhooks
FOR ALL
TO authenticated
USING (public.can_manage_company(auth.uid(), company_id))
WITH CHECK (public.can_manage_company(auth.uid(), company_id));

DROP POLICY IF EXISTS "Users can view linked company memberships" ON public.user_companies;
DROP POLICY IF EXISTS "Super admins can manage company memberships" ON public.user_companies;

CREATE POLICY "Users can view linked company memberships"
ON public.user_companies
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()) OR public.has_company_role(auth.uid(), company_id, ARRAY['company_admin']::public.company_user_role[]));

CREATE POLICY "Super admins can manage company memberships"
ON public.user_companies
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_user_companies_updated_at ON public.user_companies;
CREATE TRIGGER update_user_companies_updated_at
BEFORE UPDATE ON public.user_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP FUNCTION IF EXISTS public.get_public_company(text);
CREATE OR REPLACE FUNCTION public.get_public_company(_slug text)
RETURNS TABLE(id uuid, name text, slug text, logo_url text, segment text, whatsapp text, google_reviews_url text, initial_review_question text, alert_phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.segment,
    c.whatsapp,
    COALESCE(c.review_google_url, c.google_reviews_url) AS google_reviews_url,
    COALESCE(c.initial_question, c.initial_review_question) AS initial_review_question,
    c.alert_phone
  FROM public.companies c
  WHERE c.slug = _slug
    AND c.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_company_response_months(_company_id uuid)
RETURNS TABLE(month_start date, month_label text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  WHERE r.company_id = _company_id
    AND public.has_company_role(auth.uid(), _company_id)
  ORDER BY month_start DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_companies()
RETURNS TABLE(id uuid, name text, slug text, alert_phone text, google_reviews_url text, initial_review_question text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.alert_phone, COALESCE(c.review_google_url, c.google_reviews_url), COALESCE(c.initial_question, c.initial_review_question), c.created_at
  FROM public.companies c
  WHERE public.is_super_admin(auth.uid())
  ORDER BY c.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_company(_name text, _slug text, _alert_phone text DEFAULT NULL, _google_url text DEFAULT NULL, _initial_question text DEFAULT 'Como foi sua experiência hoje?')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  INSERT INTO public.companies (name, slug, owner_user_id, alert_phone, google_reviews_url, review_google_url, initial_review_question, initial_question)
  VALUES (left(trim(_name), 120), lower(trim(_slug)), auth.uid(), NULLIF(_alert_phone, ''), NULLIF(_google_url, ''), NULLIF(_google_url, ''), left(trim(_initial_question), 180), left(trim(_initial_question), 180))
  RETURNING id INTO _company_id;

  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (auth.uid(), _company_id, 'super_admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN _company_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_link_user_to_company(_user_id uuid, _company_id uuid, _role public.company_user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (_user_id, _company_id, _role)
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();

  RETURN true;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_experience_responses_company_created ON public.experience_responses(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_requests_company_created ON public.budget_requests(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_requests_company_status ON public.budget_requests(company_id, status);
