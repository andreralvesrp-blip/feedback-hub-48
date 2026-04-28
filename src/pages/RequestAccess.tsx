import { useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const requestSchema = z.object({
  fullName: z.string().trim().min(2, "Informe nome e sobrenome.").max(120),
  companyName: z.string().trim().min(2, "Informe o nome da empresa.").max(120),
  document: z.string().trim().transform((value) => value.replace(/[^0-9]/g, "")).refine((value) => value.length === 11 || value.length === 14, "Informe CPF ou CNPJ válido."),
  whatsapp: z.string().trim().transform((value) => value.replace(/[^0-9]/g, "")).refine((value) => value.length >= 10 && value.length <= 13, "Informe um WhatsApp válido."),
  email: z.string().trim().email("Informe um email válido.").max(255),
});

const RequestAccess = () => {
  const [form, setForm] = useState({ fullName: "", companyName: "", document: "", whatsapp: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os dados.");
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).rpc("submit_access_request", {
      _full_name: parsed.data.fullName,
      _company_name: parsed.data.companyName,
      _document: parsed.data.document,
      _whatsapp: parsed.data.whatsapp,
      _email: parsed.data.email,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar sua solicitação.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center">
        <Button asChild variant="quiet" className="mb-5 w-fit">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
        <section className="rounded-lg bg-card p-5 shadow-soft sm:p-7">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-brand-soft text-primary">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight">Solicitação recebida</h1>
                <p className="text-muted-foreground">Recebemos sua solicitação. Em breve você receberá os dados de acesso à plataforma.</p>
              </div>
              <Button asChild variant="hero" size="touch" className="w-full">
                <Link to="/login">Ir para login</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-tight">Solicitar acesso à plataforma</h1>
                  <p className="mt-2 text-muted-foreground">Preencha os dados abaixo para solicitar acesso. Nossa equipe irá liberar sua conta.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Nome e sobrenome" className="h-12 rounded-lg" />
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="Nome da empresa" className="h-12 rounded-lg pl-11" />
                </div>
                <Input value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} placeholder="CNPJ ou CPF" className="h-12 rounded-lg" />
                <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp" className="h-12 rounded-lg" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-12 rounded-lg pl-11" />
                </div>
              </div>
              <Button variant="hero" size="touch" className="w-full" onClick={submit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Solicitar acesso
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default RequestAccess;