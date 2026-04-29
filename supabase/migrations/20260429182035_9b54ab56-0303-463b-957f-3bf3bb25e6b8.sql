CREATE TABLE public.home_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company_name text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.home_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create home leads"
ON public.home_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name = regexp_replace(left(trim(name), 120), '\s+', ' ', 'g')
  AND company_name = left(trim(company_name), 120)
  AND whatsapp = regexp_replace(whatsapp, '[^0-9]', '', 'g')
  AND name ~* '^[A-ZÀ-ÖØ-öø-ÿ]{2,}( [A-ZÀ-ÖØ-öø-ÿ''-]{2,})+$'
  AND char_length(company_name) >= 3
  AND public.is_valid_br_mobile(whatsapp)
);

CREATE POLICY "Super admins can view home leads"
ON public.home_leads
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_home_leads_created_at ON public.home_leads (created_at DESC);