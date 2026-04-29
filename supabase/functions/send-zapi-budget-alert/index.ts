import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BudgetAlertPayload = {
  log_id?: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanPhone = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "");

const formatDestinationPhone = (value: string | null | undefined) => {
  const digits = cleanPhone(value);

  if (digits.length === 11) return `55${digits}`;
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) return digits;

  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");
    const zapiInstanceToken = Deno.env.get("ZAPI_INSTANCE_TOKEN");
    const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Z-API alert unavailable: backend credentials missing");
      return jsonResponse({ error: "Configuração do backend indisponível." }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as BudgetAlertPayload;
    const logId = String(body.log_id ?? "").trim();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(logId)) {
      return jsonResponse({ error: "log_id inválido." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: log, error: logError } = await supabase
      .from("zapi_message_logs")
      .select("id, company_id, budget_request_id, phone_to, message, status")
      .eq("id", logId)
      .maybeSingle();

    if (logError || !log) {
      console.error("Z-API alert log not found", { logId, error: logError?.message });
      return jsonResponse({ error: "Log não encontrado." }, 404);
    }

    if (log.status === "sent") {
      return jsonResponse({ ok: true, skipped: "already_sent" });
    }

    if (!zapiInstanceId || !zapiInstanceToken || !zapiClientToken) {
      const responseBody = { error: "Credenciais Z-API ausentes no backend" };
      await supabase
        .from("zapi_message_logs")
        .update({ status: "failed", response_body: responseBody })
        .eq("id", log.id);
      console.error("Z-API alert credentials missing", { logId });
      return jsonResponse({ ok: false }, 200);
    }

    const phone = formatDestinationPhone(log.phone_to);

    if (!phone) {
      const responseBody = { error: "Telefone de destino inválido", phone_to: log.phone_to };
      await supabase
        .from("zapi_message_logs")
        .update({ status: "failed", response_body: responseBody })
        .eq("id", log.id);
      console.error("Z-API alert invalid destination phone", { logId, phone_to: log.phone_to });
      return jsonResponse({ ok: false }, 200);
    }

    const endpoint = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiInstanceToken}/send-text`;
    const zapiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Client-Token": zapiClientToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, message: log.message }),
    });

    const responseText = await zapiResponse.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch (_error) {
      responseBody = { raw: responseText };
    }

    if (!zapiResponse.ok) {
      await supabase
        .from("zapi_message_logs")
        .update({ status: "failed", response_body: responseBody })
        .eq("id", log.id);
      console.error("Z-API alert failed", { logId, status: zapiResponse.status, responseBody });
      return jsonResponse({ ok: false }, 200);
    }

    await supabase
      .from("zapi_message_logs")
      .update({ status: "sent", response_body: responseBody })
      .eq("id", log.id);

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Z-API alert unexpected error", error);
    return jsonResponse({ ok: false }, 200);
  }
});
