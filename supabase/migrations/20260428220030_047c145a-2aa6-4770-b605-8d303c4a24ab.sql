CREATE OR REPLACE FUNCTION public.user_has_any_company(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_companies uc
    WHERE uc.user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Super admins and unlinked users can create companies" ON public.companies;
CREATE POLICY "Super admins and unlinked users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    owner_user_id = auth.uid()
    AND NOT public.user_has_any_company(auth.uid())
  )
);

REVOKE EXECUTE ON FUNCTION public.user_has_any_company(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_any_company(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_has_any_company(uuid) TO authenticated;