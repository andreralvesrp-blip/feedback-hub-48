CREATE OR REPLACE FUNCTION public.assign_company_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_user uuid;
BEGIN
  _current_user := auth.uid();

  IF _current_user IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_companies (user_id, company_id, role, created_at)
  VALUES (_current_user, NEW.id, 'company_admin', now())
  ON CONFLICT (user_id, company_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.assign_company_owner_membership();

CREATE OR REPLACE FUNCTION public.mark_experience_google_review_intent(_response_id uuid, _company_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id uuid;
BEGIN
  IF _response_id IS NULL OR NULLIF(trim(COALESCE(_company_slug, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT c.id INTO _company_id
  FROM public.companies c
  WHERE c.slug = lower(trim(_company_slug))
    AND c.is_active = true
  LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  UPDATE public.experience_responses r
  SET wants_google_review = true,
      redirected_to_google = true,
      updated_at = now()
  WHERE r.id = _response_id
    AND r.company_id = _company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resposta não pertence à empresa informada';
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_budget_request(_company_slug text, _name text, _whatsapp text, _interest interest_type, _experience_rating experience_rating DEFAULT NULL::experience_rating, _experience_response_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id uuid;
  _budget_id uuid;
  _clean_name text;
  _clean_phone text;
  _response_company_id uuid;
BEGIN
  SELECT id INTO _company_id
  FROM public.companies
  WHERE slug = lower(trim(_company_slug)) AND is_active = true
  LIMIT 1;

  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada';
  END IF;

  IF _experience_response_id IS NOT NULL THEN
    SELECT company_id INTO _response_company_id
    FROM public.experience_responses
    WHERE id = _experience_response_id
    LIMIT 1;

    IF _response_company_id IS NULL THEN
      RAISE EXCEPTION 'Resposta de experiência não encontrada';
    END IF;

    IF _response_company_id <> _company_id THEN
      RAISE EXCEPTION 'Resposta não pertence à empresa informada';
    END IF;
  END IF;

  _clean_name := regexp_replace(left(trim(COALESCE(_name, '')), 120), '\s+', ' ', 'g');
  _clean_phone := regexp_replace(COALESCE(_whatsapp, ''), '[^0-9]', '', 'g');

  IF char_length(_clean_name) < 2 OR _clean_phone !~ '^[0-9]{11}$' OR _clean_phone ~ '^([0-9])\1{10}$' THEN
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

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_company(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_access_request(text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_experience_response(text, experience_rating, text, text, text, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_budget_request(text, text, text, interest_type, experience_rating, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_experience_google_review_intent(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_panel_metrics(text, text, date) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, uuid, company_user_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_company(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_access_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_link_user_to_company(uuid, uuid, company_user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_company(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_response_months(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_valid_cpf(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_cnpj(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_br_mobile(text) TO anon, authenticated;