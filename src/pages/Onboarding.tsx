import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120),
  alert_phone: z.string().trim().min(8, "Informe o telefone para envio de orçamento.").max(30),
  google_reviews_url: z.string().trim().url("Informe uma URL válida."),
  initial_review_question: z.string().trim().min(5, "Informe a pergunta inicial.").max(180),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 52) || "minha-empresa";

const Onboarding = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    alert_phone: "",
    google_reviews_url: "",
    initial_review_question: "Como foi sua experiência hoje?",
  });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: memberships, error } = await (supabase as any).from("user_companies").select("id").limit(1);
      if (error) {
        toast.error("Não foi possível verificar seu acesso.");
        navigate("/login", { replace: true });
        return;
      }
      if (memberships && memberships.length > 0) {
        navigate("/app", { replace: true });
        return;
      }

      setUserId(data.session.user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const submit = async () => {
    const parsed = onboardingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os campos.");
      return;
    }

    const slug = `${slugify(parsed.data.name)}-${userId.slice(0, 8)}`;
    setSaving(true);
    const { error } = await (supabase as any).from("companies").insert({
      owner_user_id: userId,
      name: parsed.data.name,
      slug,
      alert_phone: parsed.data.alert_phone,
      google_reviews_url: parsed.data.google_reviews_url,
      review_google_url: parsed.data.google_reviews_url,
      initial_review_question: parsed.data.initial_review_question,
      initial_question: parsed.data.initial_review_question,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || "Não foi possível criar a empresa.");
      return;
    }

    toast.success("Empresa criada com sucesso.");
    navigate("/app", { replace: true });
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-8">
      <section className="w-full max-w-xl rounded-lg bg-card p-5 shadow-soft animate-soft-rise">
        <div className="mb-7 space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Configure sua empresa</h1>
            <p className="text-muted-foreground">Preencha os dados iniciais para liberar seu painel.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa" className="h-12 rounded-lg" />
          <Input value={form.alert_phone} onChange={(e) => setForm((f) => ({ ...f, alert_phone: e.target.value }))} placeholder="Telefone para envio de novo orçamento" inputMode="tel" className="h-12 rounded-lg" />
          <Input value={form.google_reviews_url} onChange={(e) => setForm((f) => ({ ...f, google_reviews_url: e.target.value }))} placeholder="URL de review do Google" inputMode="url" className="h-12 rounded-lg" />
          <Textarea value={form.initial_review_question} onChange={(e) => setForm((f) => ({ ...f, initial_review_question: e.target.value }))} placeholder="Pergunta inicial para avaliação" maxLength={180} className="min-h-24 rounded-lg" />
          <Button variant="hero" size="touch" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar e criar empresa
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Onboarding;
