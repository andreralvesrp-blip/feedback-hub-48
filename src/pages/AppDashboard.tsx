import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Copy, Download, ExternalLink, Loader2, LogOut, MessageCircle, QrCode, Settings, Star, Table2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SessionUser = { id: string; email?: string };
type Company = { id: string; owner_user_id: string; name: string; slug: string; logo_url: string | null; segment: string | null; whatsapp: string | null; google_reviews_url: string | null; responsible_name: string | null; login_email: string | null; alert_phone: string | null; plan: string; public_panel_token: string; };
type ExperienceRating = "loved" | "ok" | "improve";
type ExperienceResponse = { id: string; created_at: string; experience_rating: ExperienceRating; comment: string | null; name: string | null; whatsapp: string | null; wants_google_review: boolean; redirected_to_google: boolean; status: string; };
type Budget = { id: string; created_at: string; name: string; whatsapp: string; interest: string; experience_rating: ExperienceRating | null; status: string; };
type Webhook = { id: string; name: string; url: string; is_active: boolean; };

const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const interestLabel: Record<string, string> = {
  festa_infantil: "Festa infantil",
  casamento: "Casamento",
  evento_corporativo: "Evento corporativo",
  servico_para_evento: "Serviço para evento",
  outro: "Outro",
};

const budgetStatus = ["novo", "contatado", "orcamento_enviado", "fechado", "perdido"];
const responseStatus = ["novo", "visto", "resolvido"];
const periods = { month: "Mês fechado", thirty: "Últimos 30 dias" };
const experienceLabels: Record<ExperienceRating, string> = { loved: "Adorei", ok: "Foi ok", improve: "Pode melhorar" };
const experienceFilters = { all: "Todas", loved: "Adorei", ok: "Foi ok", improve: "Pode melhorar" };

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "minha-empresa";
const cleanPhone = (value: string) => value.replace(/[^0-9]/g, "");
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const AppDashboard = () => {
  const navigate = useNavigate();
  const qrRef = useRef<SVGSVGElement | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [responses, setResponses] = useState<ExperienceResponse[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [period, setPeriod] = useState<"month" | "thirty">("thirty");
  const [experienceFilter, setExperienceFilter] = useState<"all" | ExperienceRating>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", segment: "Eventos", whatsapp: "", google_reviews_url: "", responsible_name: "", login_email: "", alert_phone: "", plan: "starter" });
  const [webhookUrl, setWebhookUrl] = useState("");

  const reviewUrl = `${window.location.origin}/avaliar/${company?.slug || form.slug || "sua-empresa"}`;
  const panelUrl = company ? `${window.location.origin}/painel/${company.slug}?token=${company.public_panel_token}` : "";

  const filtered = useMemo(() => {
    const now = new Date();
    const start = period === "thirty" ? new Date(now.getTime() - 30 * 86400000) : new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      responses: responses.filter((r) => new Date(r.created_at) >= start),
      budgets: budgets.filter((b) => new Date(b.created_at) >= start),
    };
  }, [responses, budgets, period]);

  const stats = useMemo(() => {
    const total = filtered.responses.length;
    const loved = filtered.responses.filter((r) => r.experience_rating === "loved").length;
    const ok = filtered.responses.filter((r) => r.experience_rating === "ok").length;
    const improve = filtered.responses.filter((r) => r.experience_rating === "improve").length;
    const experienceIndex = total ? Math.round((loved / total) * 100) : 0;
    return {
      experienceIndex,
      total,
      loved,
      ok,
      improve,
      budgets: filtered.budgets.length,
      google: filtered.responses.filter((r) => r.wants_google_review || r.redirected_to_google).length,
    };
  }, [filtered]);

  const loadData = async (companyId: string) => {
    const [res, bud, hooks] = await Promise.all([
      (supabase as any).from("experience_responses").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("budget_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200),
      (supabase as any).from("webhooks").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    ]);
    setResponses(res.data ?? []);
    setBudgets(bud.data ?? []);
    setWebhooks(hooks.data ?? []);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      const currentUser = { id: data.session.user.id, email: data.session.user.email ?? "" };
      setUser(currentUser);
      const { data: companies } = await (supabase as any).from("companies").select("*").eq("owner_user_id", currentUser.id).order("created_at", { ascending: true }).limit(1);
      const first = companies?.[0] ?? null;
      setCompany(first);
      setForm({
        name: first?.name ?? "",
        slug: first?.slug ?? "",
        logo_url: first?.logo_url ?? "",
        segment: first?.segment ?? "Eventos",
        whatsapp: first?.whatsapp ?? "",
        google_reviews_url: first?.google_reviews_url ?? "",
        responsible_name: first?.responsible_name ?? "",
        login_email: first?.login_email ?? currentUser.email ?? "",
        alert_phone: first?.alert_phone ?? "",
        plan: first?.plan ?? "starter",
      });
      if (first) await loadData(first.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const saveCompany = async () => {
    if (!user) return;
    const parsed = companySchema.safeParse({ name: form.name, slug: form.slug || slugify(form.name) });
    if (!parsed.success) {
      toast.error("Informe nome e slug válido, usando letras, números e hífens.");
      return;
    }
    setSaving(true);
    const payload = { ...form, ...parsed.data, owner_user_id: user.id, logo_url: form.logo_url || null, whatsapp: form.whatsapp || null, google_reviews_url: form.google_reviews_url || null, alert_phone: form.alert_phone || null };
    const result = company
      ? await (supabase as any).from("companies").update(payload).eq("id", company.id).select("*").single()
      : await (supabase as any).from("companies").insert(payload).select("*").single();
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    setCompany(result.data);
    toast.success("Configurações salvas.");
    await loadData(result.data.id);
  };

  const updateResponse = async (id: string, status: string) => {
    await (supabase as any).from("experience_responses").update({ status }).eq("id", id);
    setResponses((items) => items.map((i) => i.id === id ? { ...i, status } : i));
  };

  const updateBudget = async (id: string, status: string) => {
    await (supabase as any).from("budget_requests").update({ status }).eq("id", id);
    setBudgets((items) => items.map((i) => i.id === id ? { ...i, status } : i));
  };

  const addWebhook = async () => {
    if (!company || !webhookUrl.startsWith("https://")) {
      toast.error("Use uma URL https válida.");
      return;
    }
    const { data, error } = await (supabase as any).from("webhooks").insert({ company_id: company.id, url: webhookUrl }).select("*").single();
    if (error) toast.error(error.message);
    else {
      setWebhooks((items) => [data, ...items]);
      setWebhookUrl("");
      toast.success("Webhook adicionado.");
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success("Link copiado.");
  };

  const downloadQr = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${company?.slug || "captura-eventos"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResponsesCsv = () => {
    const rows = responses.map((r) => [formatDate(r.created_at), experienceLabels[r.experience_rating], r.comment || "", r.name || "", r.whatsapp || "", "QR", r.wants_google_review || r.redirected_to_google ? "sim" : "não"]);
    const csv = [["Data", "Experiência", "Comentário", "Nome", "WhatsApp", "Origem", "Google"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `experiencias-${company?.slug || "empresa"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Captura Eventos</p>
            <h1 className="text-xl font-black leading-tight">{company?.name || "Configure sua empresa"}</h1>
          </div>
          <Button variant="quiet" size="icon" onClick={signOut} aria-label="Sair"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5">
        <Tabs defaultValue={company ? "dashboard" : "settings"} className="space-y-5">
          <TabsList className="grid h-auto grid-cols-5 rounded-2xl bg-muted p-1">
            <TabsTrigger value="dashboard" className="rounded-xl"><BarChart3 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Painel</span></TabsTrigger>
            <TabsTrigger value="responses" className="rounded-xl"><Table2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Respostas</span></TabsTrigger>
            <TabsTrigger value="budgets" className="rounded-xl"><MessageCircle className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Orçamentos</span></TabsTrigger>
            <TabsTrigger value="qr" className="rounded-xl"><QrCode className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">QR</span></TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl"><Settings className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Config</span></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-5">
            <div className="flex justify-end"><Select value={period} onValueChange={(v) => setPeriod(v as "month" | "thirty")}><SelectTrigger className="w-48 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(periods).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {[["Índice de Experiência", `${stats.experienceIndex}%`], ["Respostas", stats.total], ["Adorei", stats.loved], ["Foi ok", stats.ok], ["Pode melhorar", stats.improve], ["Orçamentos", stats.budgets], ["Google", stats.google]].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-black">{value}</p></div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PanelList title="Últimos feedbacks" empty="Nenhum feedback ainda.">{responses.slice(0, 5).map((r) => <Row key={r.id} title={experienceLabels[r.experience_rating]} subtitle={r.comment || "Sem comentário"} meta={formatDate(r.created_at)} />)}</PanelList>
              <PanelList title="Últimos leads" empty="Nenhum orçamento ainda.">{budgets.slice(0, 5).map((b) => <Row key={b.id} title={b.name} subtitle={interestLabel[b.interest] || b.interest} meta={formatDate(b.created_at)} />)}</PanelList>
            </div>
          </TabsContent>

          <TabsContent value="responses"><DataCard title="Respostas" action={<><Select value={experienceFilter} onValueChange={(v) => setExperienceFilter(v as "all" | ExperienceRating)}><SelectTrigger className="w-44 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(experienceFilters).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={downloadResponsesCsv}><Download className="h-4 w-4" /> CSV</Button></>}>{responses.length === 0 ? <Empty /> : responses.filter((r) => experienceFilter === "all" || r.experience_rating === experienceFilter).map((r) => <div key={r.id} className="grid gap-3 border-b border-border py-4 lg:grid-cols-[0.8fr_0.8fr_1.5fr_0.8fr_0.8fr_0.8fr]"><Cell label="Data" value={formatDate(r.created_at)} /><Cell label="Experiência" value={experienceLabels[r.experience_rating]} /><Cell label="Comentário" value={r.comment || "—"} /><Cell label="Contato" value={`${r.name || "—"} ${r.whatsapp || ""}`} /><Cell label="Google" value={r.wants_google_review || r.redirected_to_google ? "Sim" : "Não"} /><Select value={r.status} onValueChange={(v) => updateResponse(r.id, v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{responseStatus.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>)}</DataCard></TabsContent>

          <TabsContent value="budgets"><DataCard title="Orçamentos">{budgets.length === 0 ? <Empty /> : budgets.map((b) => <div key={b.id} className="grid gap-3 border-b border-border py-4 lg:grid-cols-[0.8fr_1fr_1fr_1fr_0.8fr_1fr_0.8fr]"><Cell label="Data" value={formatDate(b.created_at)} /><Cell label="Nome" value={b.name} /><Cell label="WhatsApp" value={b.whatsapp} /><Cell label="Interesse" value={interestLabel[b.interest] || b.interest} /><Cell label="Experiência" value={b.experience_rating ? experienceLabels[b.experience_rating] : "—"} /><Select value={b.status} onValueChange={(v) => updateBudget(b.id, v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{budgetStatus.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select><Button asChild variant="hero"><a href={`https://wa.me/${cleanPhone(b.whatsapp)}`} target="_blank" rel="noreferrer">Chamar</a></Button></div>)}</DataCard></TabsContent>

          <TabsContent value="qr" className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-card p-5 shadow-soft"><QRCodeSVG ref={qrRef} value={reviewUrl} size={220} level="H" className="mx-auto h-auto w-full max-w-[220px]" /><div className="mt-5 grid gap-3"><Button variant="hero" size="touch" onClick={() => copy(reviewUrl)}><Copy className="h-4 w-4" /> Copiar link</Button><Button variant="outline" size="touch" onClick={downloadQr}><Download className="h-4 w-4" /> Download do QR</Button></div></section>
            <section className="rounded-3xl bg-gradient-card p-6 shadow-soft"><p className="text-sm font-bold text-primary">Arte simples para impressão</p><h2 className="mt-3 text-3xl font-black">Avalie sua experiência</h2><p className="mt-2 text-muted-foreground">Aponte a câmera do celular para o QR Code e responda em menos de 60 segundos.</p><div className="mt-6 rounded-2xl bg-card p-3 text-sm break-all">{reviewUrl}</div>{panelUrl && <Button asChild variant="quiet" className="mt-4"><Link to={panelUrl} target="_blank"><ExternalLink className="h-4 w-4" /> Painel público</Link></Button>}</section>
          </TabsContent>

          <TabsContent value="settings" className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl bg-card p-5 shadow-soft"><h2 className="mb-4 text-2xl font-black">Configurações da empresa</h2><div className="grid gap-3 sm:grid-cols-2">{[
              ["name", "Nome"], ["slug", "Slug"], ["logo_url", "Logo (URL)"], ["segment", "Segmento"], ["whatsapp", "WhatsApp"], ["google_reviews_url", "Link Google Reviews"], ["responsible_name", "Nome do responsável"], ["login_email", "Email login"], ["alert_phone", "Telefone para alerta"], ["plan", "Plano"],
            ].map(([key, label]) => <Input key={key} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: key === "slug" ? slugify(e.target.value) : e.target.value }))} placeholder={label} className="h-13 rounded-2xl" />)}</div><Button variant="hero" size="touch" className="mt-4 w-full" onClick={saveCompany} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button></section>
            <section className="rounded-3xl bg-card p-5 shadow-soft"><h2 className="text-2xl font-black">Webhooks</h2><p className="mt-1 text-sm text-muted-foreground">Receba alertas quando chegar novo orçamento.</p><div className="mt-4 flex gap-2"><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." className="rounded-2xl" /><Button variant="warm" onClick={addWebhook}>Adicionar</Button></div><div className="mt-4 space-y-2">{webhooks.map((w) => <div key={w.id} className="rounded-2xl bg-muted p-3 text-sm break-all">{w.url}</div>)}</div></section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

const PanelList = ({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) => <section className="rounded-3xl bg-card p-5 shadow-soft"><h2 className="mb-3 text-xl font-black">{title}</h2><div className="space-y-3">{children || <p className="text-muted-foreground">{empty}</p>}</div></section>;
const Row = ({ title, subtitle, meta }: { title: string; subtitle: string; meta: string }) => <div className="rounded-2xl bg-muted p-3"><div className="flex justify-between gap-3"><p className="font-bold">{title}</p><p className="text-xs text-muted-foreground">{meta}</p></div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p></div>;
const DataCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => <section className="rounded-3xl bg-card p-4 shadow-soft"><div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-2xl font-black">{title}</h2>{action && <div className="flex gap-2">{action}</div>}</div>{children}</section>;
const Cell = ({ label, value }: { label: string; value: string }) => <div><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="break-words text-sm font-semibold">{value}</p></div>;
const Empty = () => <div className="grid min-h-40 place-items-center rounded-3xl bg-muted text-center text-muted-foreground"><div><Star className="mx-auto mb-2 h-8 w-8 text-primary" /><p>Nenhum dado ainda.</p></div></div>;

export default AppDashboard;
