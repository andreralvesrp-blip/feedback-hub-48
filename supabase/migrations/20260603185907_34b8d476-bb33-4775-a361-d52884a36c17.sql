
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
GRANT INSERT ON public.access_requests TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_requests TO authenticated;
GRANT ALL ON public.budget_requests TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.experience_responses TO authenticated;
GRANT ALL ON public.experience_responses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_leads TO authenticated;
GRANT ALL ON public.home_leads TO service_role;
GRANT INSERT ON public.home_leads TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_companies TO authenticated;
GRANT ALL ON public.user_companies TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.zapi_message_logs TO authenticated;
GRANT ALL ON public.zapi_message_logs TO service_role;
