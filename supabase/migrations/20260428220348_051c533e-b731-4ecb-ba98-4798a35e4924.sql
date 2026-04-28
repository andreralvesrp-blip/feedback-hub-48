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

REVOKE EXECUTE ON FUNCTION public.user_has_any_company(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_any_company(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_has_any_company(uuid) TO authenticated;

DROP POLICY IF EXISTS "Super admins and unlinked users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create first company" ON public.companies;

CREATE POLICY "Authenticated users can create first company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    public.is_super_admin(auth.uid())
    OR (
      owner_user_id = auth.uid()
      AND NOT public.user_has_any_company(auth.uid())
    )
  )
);