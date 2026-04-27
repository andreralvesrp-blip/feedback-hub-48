REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_budget_webhooks() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Company logos are publicly readable" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'company-logos';

CREATE POLICY "Users can view their own company logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);