CREATE TABLE IF NOT EXISTS public.zapi_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  budget_request_id uuid NOT NULL REFERENCES public.budget_requests(id) ON DELETE CASCADE,
  phone_to text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('sent', 'failed')),
  response_body jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.zapi_message_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_zapi_message_logs_company_id ON public.zapi_message_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_zapi_message_logs_budget_request_id ON public.zapi_message_logs(budget_request_id);
CREATE INDEX IF NOT EXISTS idx_zapi_message_logs_created_at ON public.zapi_message_logs(created_at DESC);

DROP POLICY IF EXISTS "Linked users can view company zapi message logs" ON public.zapi_message_logs;
CREATE POLICY "Linked users can view company zapi message logs"
ON public.zapi_message_logs
FOR SELECT
TO authenticated
USING (public.has_company_role(auth.uid(), company_id));

DROP FUNCTION IF EXISTS public.format_zapi_destination_phone(text);
CREATE OR REPLACE FUNCTION public.format_zapi_destination_phone(_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _digits text;
BEGIN
  _digits := regexp_replace(COALESCE(_phone, ''), '[^0-9]', '', 'g');

  IF length(_digits) = 11 THEN
    RETURN '55' || _digits;
  END IF;

  IF _digits LIKE '55%' AND length(_digits) BETWEEN 12 AND 13 THEN
    RETURN _digits;
  END IF;

  RETURN NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.notify_zapi_budget_alert();
CREATE OR REPLACE FUNCTION public.notify_zapi_budget_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _company_name text;
  _alert_phone text;
  _destination_phone text;
  _lead_whatsapp text;
  _message text;
  _log_id uuid;
  _invoke_url text;
  _anon_key text;
BEGIN
  SELECT c.name, c.alert_phone
  INTO _company_name, _alert_phone
  FROM public.companies c
  WHERE c.id = NEW.company_id;

  _destination_phone := public.format_zapi_destination_phone(_alert_phone);
  _lead_whatsapp := regexp_replace(COALESCE(NEW.whatsapp, ''), '[^0-9]', '', 'g');

  _message := '🚨 Novo pedido de orçamento' || chr(10) || chr(10) ||
    'Empresa: ' || COALESCE(_company_name, '-') || chr(10) ||
    'Nome: ' || COALESCE(NEW.name, '-') || chr(10) ||
    'WhatsApp: ' || COALESCE(_lead_whatsapp, '-') || chr(10) ||
    'Experiência: ' || COALESCE(NEW.experience_rating::text, '-') || chr(10) || chr(10) ||
    'Chamar agora:' || chr(10) ||
    'https://wa.me/55' || COALESCE(_lead_whatsapp, '');

  INSERT INTO public.zapi_message_logs (
    company_id,
    budget_request_id,
    phone_to,
    message,
    status,
    response_body
  ) VALUES (
    NEW.company_id,
    NEW.id,
    _destination_phone,
    _message,
    'failed',
    CASE
      WHEN _destination_phone IS NULL THEN jsonb_build_object('error', 'Telefone de alerta inválido', 'raw_phone', _alert_phone)
      ELSE NULL
    END
  ) RETURNING id INTO _log_id;

  IF _destination_phone IS NULL THEN
    RAISE LOG 'Z-API alert skipped: invalid alert_phone for company %, budget_request %, raw phone %', NEW.company_id, NEW.id, _alert_phone;
    RETURN NEW;
  END IF;

  _invoke_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-zapi-budget-alert';
  _anon_key := current_setting('app.settings.supabase_anon_key', true);

  IF NULLIF(_invoke_url, '') IS NULL OR _invoke_url = '/functions/v1/send-zapi-budget-alert' OR NULLIF(_anon_key, '') IS NULL THEN
    UPDATE public.zapi_message_logs
    SET response_body = jsonb_build_object('error', 'Configuração de chamada da função ausente')
    WHERE id = _log_id;
    RAISE LOG 'Z-API alert not invoked: missing function URL or anon key for log %', _log_id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := _invoke_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon_key,
      'apikey', _anon_key
    ),
    body := jsonb_build_object('log_id', _log_id),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Z-API budget alert trigger failed for budget_request %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_zapi_budget_alert_after_insert ON public.budget_requests;
CREATE TRIGGER notify_zapi_budget_alert_after_insert
AFTER INSERT ON public.budget_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_zapi_budget_alert();

REVOKE ALL ON public.zapi_message_logs FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.format_zapi_destination_phone(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_zapi_budget_alert() FROM PUBLIC, anon, authenticated;