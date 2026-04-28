REVOKE ALL ON FUNCTION public.submit_access_request(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_access_requests() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_access_request(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_access_requests() TO authenticated;