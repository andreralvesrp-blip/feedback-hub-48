CREATE OR REPLACE FUNCTION public.assign_company_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (NEW.owner_user_id, NEW.id, 'company_admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_company_owner_membership_trigger ON public.companies;
CREATE TRIGGER assign_company_owner_membership_trigger
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.assign_company_owner_membership();

REVOKE EXECUTE ON FUNCTION public.assign_company_owner_membership() FROM PUBLIC, anon, authenticated;
