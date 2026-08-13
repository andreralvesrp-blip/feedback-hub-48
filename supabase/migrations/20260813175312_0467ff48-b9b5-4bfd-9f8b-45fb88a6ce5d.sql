DELETE FROM public.zapi_message_logs WHERE budget_request_id IN (SELECT id FROM public.budget_requests WHERE name IN ('Joao Teste','Teste Sistema'));
DELETE FROM public.budget_requests WHERE name IN ('Joao Teste','Teste Sistema');
DELETE FROM public.experience_responses WHERE name IN ('Joao Teste','Teste Sistema');