CREATE OR REPLACE FUNCTION public.assign_company_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_companies (user_id, company_id, role)
  VALUES (NEW.owner_user_id, NEW.id, 'company_admin')
  ON CONFLICT (user_id, company_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS assign_company_owner_membership_trigger ON public.companies;
CREATE TRIGGER assign_company_owner_membership_trigger
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.assign_company_owner_membership();

DROP POLICY IF EXISTS "Super admins can create companies" ON public.companies;
CREATE POLICY "Super admins and unlinked users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    owner_user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
    )
  )
);