REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_public_company(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_experience_response(text, public.experience_rating, text, text, text, boolean, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_budget_request(text, text, text, public.interest_type, public.experience_rating, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_experience_google_review_intent(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_panel_metrics(text, text, date) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, uuid, public.company_user_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_company(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_response_months(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_company(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_link_user_to_company(uuid, uuid, public.company_user_role) TO authenticated;
