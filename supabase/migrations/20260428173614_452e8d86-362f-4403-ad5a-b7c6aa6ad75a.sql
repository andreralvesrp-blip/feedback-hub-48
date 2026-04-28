CREATE OR REPLACE FUNCTION public.notify_budget_webhooks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  hook RECORD;
  company_name TEXT;
  company_alert_phone TEXT;
  payload JSONB;
BEGIN
  SELECT name, alert_phone
  INTO company_name, company_alert_phone
  FROM public.companies
  WHERE id = NEW.company_id;

  payload := jsonb_build_object(
    'company', company_name,
    'alert_phone', regexp_replace(COALESCE(company_alert_phone, ''), '[^0-9]', '', 'g'),
    'experience_rating', NEW.experience_rating,
    'name', NEW.name,
    'whatsapp', NEW.whatsapp,
    'interest', NEW.interest,
    'created_at', NEW.created_at,
    'message', 'Novo pedido de orçamento:' || chr(10) ||
      'Empresa: ' || COALESCE(company_name, '-') || chr(10) ||
      'Enviar alerta para: ' || COALESCE(company_alert_phone, '-') || chr(10) ||
      'Nome: ' || NEW.name || chr(10) ||
      'WhatsApp: ' || NEW.whatsapp || chr(10) ||
      'Interesse: ' || NEW.interest || chr(10) ||
      'Experiência: ' || COALESCE(NEW.experience_rating::text, '-') || chr(10) ||
      'https://wa.me/' || regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g')
  );

  FOR hook IN
    SELECT url FROM public.webhooks
    WHERE company_id = NEW.company_id AND is_active = true
  LOOP
    PERFORM net.http_post(
      url := hook.url,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := payload
    );
  END LOOP;

  RETURN NEW;
END;
$function$;