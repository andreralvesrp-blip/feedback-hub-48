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

  PERFORM net.http_post(
    url := 'https://ltreouelyybnuwbydcok.supabase.co/functions/v1/send-zapi-budget-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imx0cmVvdWVseXlibnV3YnlkY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjQwMjgsImV4cCI6MjA5MjkwMDAyOH0.iIdqB6XVMA3vYNKdlDyXHXbq-_Ippq4gSNtp_J0w_kQ',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imx0cmVvdWVseXlibnV3YnlkY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjQwMjgsImV4cCI6MjA5MjkwMDAyOH0.iIdqB6XVMA3vYNKdlDyXHXbq-_Ippq4gSNtp_J0w_kQ'
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

REVOKE EXECUTE ON FUNCTION public.notify_zapi_budget_alert() FROM PUBLIC, anon, authenticated;