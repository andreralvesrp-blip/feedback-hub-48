import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, Copy, Download, ExternalLink, Loader2, LogOut, MessageCircle, QrCode, Settings, Star, Table2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SessionUser = { id: string; email?: string };
type Company = { id: string; owner_user_id: string; name: string; slug: string; logo_url: string | null; segment: string | null; whatsapp: string | null; google_reviews_url: string | null; responsible_name: string | null; login_email: string | null; alert_phone: string | null; plan: string; public_panel_token: string; initial_review_question?: string | null; };
type ExperienceRating = "loved" | "ok" | "improve";
type ExperienceResponse = { id: string; created_at: string; experience_rating: ExperienceRating; comment: string | null; name: string | null; whatsapp: string | null; wants_google_review: boolean; redirected_to_google: boolean; status: string; };
type Budget = { id: string; created_at: string; name: string; whatsapp: string; interest: string; experience_rating: ExperienceRating | null; status: string; };
type MonthOption = { month_start: string; month_label: string };
type PeriodValue = "current" | string;

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120),
  alert_phone: z.string().trim().max(30),
  google_reviews_url: z.string().trim().url("Informe uma URL válida.").or(z.literal("")),
  initial_review_question: z.string().trim().min(5, "Informe a pergunta inicial.").max(180),
});
const companyFieldSchemas = {
  name: companySchema.shape.name,
  alert_phone: companySchema.shape.alert_phone,
  google_reviews_url: companySchema.shape.google_reviews_url,
  initial_review_question: companySchema.shape.initial_review_question,
};
type ConfigField = keyof typeof companyFieldSchemas;

const interestLabel: Record<string, string> = {
  festa_infantil: "Festa infantil",
  casamento: "Casamento",
  evento_corporativo: "Evento corporativo",
  servico_para_evento: "Serviço para evento",
  outro: "Outro",
};

const budgetStatus = ["novo", "contatado", "orcamento_enviado", "fechado", "perdido"];
const experienceLabels: Record<ExperienceRating, string> = { loved: "Adorei", ok: "Foi ok", improve: "Não gostei" };
const experienceFilters = { all: "Todas", loved: "Adorei", ok: "Foi ok", improve: "Não gostei" };
const budgetStatusLabels: Record<string, string> = { novo: "Novo", contatado: "Contatado", orcamento_enviado: "Orçamento enviado", fechado: "Fechado", perdido: "Perdido" };
const configFieldLabels: Record<ConfigField, string> = {
  name: "Nome da empresa",
  alert_phone: "Telefone para envio de novo orçamento",
  google_reviews_url: "URL de review do Google",
  initial_review_question: "Pergunta inicial para avaliação",
};

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "minha-empresa";
const cleanPhone = (value: string) => value.replace(/[^0-9]/g, "");
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const getCurrentMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};
const formatMonthLabel = (monthStart: string) => {
  const [year, month] = monthStart.split("-").map(Number);
  return `${monthNames[(month || 1) - 1]}/${String(year).slice(-2)}`;
};
const getMonthRange = (monthStart: string) => {
  const [year, month] = monthStart.split("-").map(Number);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};
const getPeriodMonthStart = (period: PeriodValue) => period === "current" ? getCurrentMonthStart() : period;

const AppDashboard = () => {
  const navigate = useNavigate();
  const qrRef = useRef<SVGSVGElement | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [responses, setResponses] = useState<ExperienceResponse[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthOptions, setMonthOptions] = useState<MonthOption[]>([]);
  const [periodValue, setPeriodValue] = useState<PeriodValue>("current");
  const [currentMonthStart, setCurrentMonthStart] = useState(getCurrentMonthStart);
  const [experienceFilter, setExperienceFilter] = useState<"all" | ExperienceRating>("all");
  const [budgetStatusFilter, setBudgetStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [savingField, setSavingField] = useState<ConfigField | null>(null);
  const [savedField, setSavedField] = useState<ConfigField | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", segment: "Eventos", whatsapp: "", google_reviews_url: "", responsible_name: "", login_email: "", alert_phone: "", plan: "starter", initial_review_question: "Como foi sua experiência hoje?" });

  const reviewUrl = `${window.location.origin}/avaliar/${company?.slug || form.slug || "sua-empresa"}`;
  const panelUrl = company ? `${window.location.origin}/painel/${company.slug}?token=${company.public_panel_token}` : "";

  const stats = useMemo(() => {
    const total = responses.length;
    const loved = responses.filter((r) => r.experience_rating === "loved").length;
    const ok = responses.filter((r) => r.experience_rating === "ok").length;
    const improve = responses.filter((r) => r.experience_rating === "improve").length;
    const experienceIndex = total ? Math.round(((loved - improve) / total) * 100) : 0;
    return {
      experienceIndex,
      total,
      loved,
      ok,
      improve,
      budgets: budgets.length,
      google: responses.filter((r) => r.wants_google_review || r.redirected_to_google).length,
    };
  }, [responses, budgets]);

  const selectedManualMonth = periodValue === "current" ? undefined : periodValue;
  const visibleResponses = useMemo(
    () => responses.filter((r) => experienceFilter === "all" || r.experience_rating === experienceFilter),
    [responses, experienceFilter],
  );
  const visibleBudgets = useMemo(
    () => budgets.filter((b) => budgetStatusFilter === "all" || b.status === budgetStatusFilter),
    [budgets, budgetStatusFilter],
  );

  const loadData = async (companyId: string, monthStart = getPeriodMonthStart(periodValue), showLoading = true) => {
    if (showLoading) setDashboardLoading(true);
    const { start, end } = getMonthRange(monthStart);
    const [res, bud] = await Promise.all([
      (supabase as any).from("experience_responses").select("*").eq("company_id", companyId).gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }).limit(1000),
      (supabase as any).from("budget_requests").select("*").eq("company_id", companyId).gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }).limit(1000),
    ]);
    setResponses(res.data ?? []);
    setBudgets(bud.data ?? []);
    if (showLoading) setDashboardLoading(false);
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
        initial_review_question: first?.initial_review_question ?? "Como foi sua experiência hoje?",
      });
      if (first) {
        const { data: months } = await (supabase as any).rpc("get_company_response_months", { _company_id: first.id });
        const availableMonths = months ?? [];
        const currentMonth = getCurrentMonthStart();
        setMonthOptions(availableMonths);
        setPeriodValue("current");
        await loadData(first.id, currentMonth, false);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    const syncCurrentMonth = () => {
      const nextCurrentMonth = getCurrentMonthStart();
      if (nextCurrentMonth === currentMonthStart) return;

      setCurrentMonthStart(nextCurrentMonth);
      if (periodValue === "current" && company) {
        void loadData(company.id, nextCurrentMonth);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) syncCurrentMonth();
    };

    window.addEventListener("focus", syncCurrentMonth);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const timer = window.setInterval(syncCurrentMonth, 30000);

    return () => {
      window.removeEventListener("focus", syncCurrentMonth);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(timer);
    };
  }, [company, currentMonthStart, periodValue]);

  const saveCompanyField = async (field: ConfigField) => {
    if (!user) return;
    const value = form[field].trim();
    const parsed = companyFieldSchemas[field].safeParse(value);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os campos.");
      return;
    }
    if (company && value === (company[field] ?? "")) return;
    setSavingField(field);
    const payload = {
      [field]: field === "google_reviews_url" || field === "alert_phone" ? value || null : value,
      ...(field === "name" && !company ? { slug: slugify(value) } : {}),
      owner_user_id: user.id,
      slug: company?.slug || form.slug || slugify(form.name || value),
      name: field === "name" ? value : form.name,
    };
    const result = company
      ? await (supabase as any).from("companies").update(payload).eq("id", company.id).select("*").single()
      : await (supabase as any).from("companies").insert(payload).select("*").single();
    setSavingField(null);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    setCompany(result.data);
    setForm((current) => ({ ...current, ...result.data }));
    setSavedField(field);
    window.setTimeout(() => setSavedField((current) => current === field ? null : current), 1800);
    toast.success("Salvo.");
    if (!company) await loadData(result.data.id);
  };

  const updateBudget = async (id: string, status: string) => {
    await (supabase as any).from("budget_requests").update({ status }).eq("id", id);
    setBudgets((items) => items.map((i) => i.id === id ? { ...i, status } : i));
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
    const rows = visibleResponses.map((r) => [formatDate(r.created_at), experienceLabels[r.experience_rating], r.comment || "", r.name || "", r.whatsapp || "", r.wants_google_review || r.redirected_to_google ? "Sim" : "Não"]);
    const csv = [["Data", "Experiência", "Comentário", "Nome", "WhatsApp", "Google"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
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

  const handleCurrentMonthClick = async () => {
    const nextCurrentMonth = getCurrentMonthStart();
    setCurrentMonthStart(nextCurrentMonth);
    setPeriodValue("current");
    if (company) await loadData(company.id, nextCurrentMonth);
  };

  const handleManualMonthChange = async (value: string) => {
    setPeriodValue(value);
    if (company) await loadData(company.id, value);
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3"><span className="text-sm font-semibold text-muted-foreground">Período</span><div className="flex items-center gap-2"><Button variant={periodValue === "current" ? "hero" : "outline"} onClick={handleCurrentMonthClick} disabled={!company || dashboardLoading}>Mês atual</Button><Select value={selectedManualMonth} onValueChange={handleManualMonthChange} disabled={!company || dashboardLoading}><SelectTrigger className="w-52 rounded-2xl"><SelectValue placeholder="Selecionar mês" /></SelectTrigger><SelectContent>{monthOptions.map((month) => <SelectItem key={month.month_start} value={month.month_start}>{month.month_label}</SelectItem>)}</SelectContent></Select>{dashboardLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}</div></div>
            <div className={`grid gap-3 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-7 ${dashboardLoading ? "opacity-60" : "opacity-100"}`}>
              {[["Índice de Experiência", stats.experienceIndex], ["Respostas", stats.total], ["Adorei", stats.loved], ["Foi ok", stats.ok], ["Não gostei", stats.improve], ["Orçamentos", stats.budgets], ["Google", stats.google]].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-card p-4 shadow-soft"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-black">{value}</p></div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PanelList title="Últimos feedbacks" empty="Nenhum feedback ainda.">{responses.slice(0, 5).map((r) => <Row key={r.id} title={experienceLabels[r.experience_rating]} subtitle={r.comment || "Sem comentário"} meta={formatDate(r.created_at)} />)}</PanelList>
              <PanelList title="Últimos leads" empty="Nenhum orçamento ainda.">{budgets.slice(0, 5).map((b) => <Row key={b.id} title={b.name} subtitle={interestLabel[b.interest] || b.interest} meta={formatDate(b.created_at)} />)}</PanelList>
            </div>
          </TabsContent>

          <TabsContent value="responses"><DataCard title="Respostas" action={<><Select value={experienceFilter} onValueChange={(v) => setExperienceFilter(v as "all" | ExperienceRating)}><SelectTrigger className="w-44 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(experienceFilters).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={downloadResponsesCsv}><Download className="h-4 w-4" /> CSV</Button></>}>{visibleResponses.length === 0 ? <Empty /> : visibleResponses.map((r) => <div key={r.id} className="grid gap-3 border-b border-border py-4 lg:grid-cols-[0.8fr_0.8fr_1.5fr_0.8fr_0.8fr]"><Cell label="Data" value={formatDate(r.created_at)} /><Cell label="Experiência" value={experienceLabels[r.experience_rating]} /><Cell label="Comentário" value={r.comment || "—"} /><Cell label="Contato" value={`${r.name || "—"} ${r.whatsapp || ""}`} /><Cell label="Google" value={r.wants_google_review || r.redirected_to_google ? "Sim" : "Não"} /></div>)}</DataCard></TabsContent>

          <TabsContent value="budgets"><DataCard title="Orçamentos" action={<Select value={budgetStatusFilter} onValueChange={setBudgetStatusFilter}><SelectTrigger className="w-52 rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{budgetStatus.map((s) => <SelectItem key={s} value={s}>{budgetStatusLabels[s]}</SelectItem>)}</SelectContent></Select>}>{visibleBudgets.length === 0 ? <Empty /> : visibleBudgets.map((b) => <div key={b.id} className="grid gap-3 border-b border-border py-4 lg:grid-cols-[0.8fr_1fr_1fr_1fr_0.8fr_1fr_0.8fr]"><Cell label="Data" value={formatDate(b.created_at)} /><Cell label="Nome" value={b.name} /><Cell label="WhatsApp" value={b.whatsapp} /><Cell label="Interesse" value={interestLabel[b.interest] || b.interest} /><Cell label="Experiência" value={b.experience_rating ? experienceLabels[b.experience_rating] : "—"} /><Select value={b.status} onValueChange={(v) => updateBudget(b.id, v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{budgetStatus.map((s) => <SelectItem key={s} value={s}>{budgetStatusLabels[s]}</SelectItem>)}</SelectContent></Select><Button asChild variant="hero"><a href={`https://wa.me/${cleanPhone(b.whatsapp)}`} target="_blank" rel="noreferrer">Chamar</a></Button></div>)}</DataCard></TabsContent>

          <TabsContent value="qr" className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-card p-5 shadow-soft"><QRCodeSVG ref={qrRef} value={reviewUrl} size={220} level="H" className="mx-auto h-auto w-full max-w-[220px]" /><div className="mt-5 grid gap-3"><Button variant="hero" size="touch" onClick={() => copy(reviewUrl)}><Copy className="h-4 w-4" /> Copiar link</Button><Button variant="outline" size="touch" onClick={downloadQr}><Download className="h-4 w-4" /> Download do QR</Button></div></section>
            <section className="rounded-3xl bg-gradient-card p-6 shadow-soft"><p className="text-sm font-bold text-primary">Arte simples para impressão</p><h2 className="mt-3 text-3xl font-black">Avalie sua experiência</h2><p className="mt-2 text-muted-foreground">Aponte a câmera do celular para o QR Code e responda em menos de 60 segundos.</p><div className="mt-6 rounded-2xl bg-card p-3 text-sm break-all">{reviewUrl}</div>{panelUrl && <Button asChild variant="quiet" className="mt-4"><Link to={panelUrl} target="_blank"><ExternalLink className="h-4 w-4" /> Painel público</Link></Button>}</section>
          </TabsContent>

          <TabsContent value="settings">
            <section className="mx-auto max-w-2xl rounded-3xl bg-card p-5 shadow-soft"><h2 className="mb-5 text-2xl font-black">Configurações</h2><div className="grid gap-4"><InlineConfigField field="name" value={form.name} onChange={(value) => setForm((f) => ({ ...f, name: value }))} onSave={saveCompanyField} saving={savingField === "name"} saved={savedField === "name"} /><InlineConfigField field="alert_phone" value={form.alert_phone} onChange={(value) => setForm((f) => ({ ...f, alert_phone: value }))} onSave={saveCompanyField} saving={savingField === "alert_phone"} saved={savedField === "alert_phone"} inputMode="tel" /><InlineConfigField field="google_reviews_url" value={form.google_reviews_url} onChange={(value) => setForm((f) => ({ ...f, google_reviews_url: value }))} onSave={saveCompanyField} saving={savingField === "google_reviews_url"} saved={savedField === "google_reviews_url"} inputMode="url" /><InlineConfigField field="initial_review_question" value={form.initial_review_question} onChange={(value) => setForm((f) => ({ ...f, initial_review_question: value }))} onSave={saveCompanyField} saving={savingField === "initial_review_question"} saved={savedField === "initial_review_question"} multiline /></div></section>
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
