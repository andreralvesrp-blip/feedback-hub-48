import { useEffect, useMemo, useState } from "react";
import { Building2, ClipboardList, Loader2, LogOut, Plus, Shield, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminCompany = {
  id: string;
  name: string;
  slug: string;
  alert_phone: string | null;
  google_reviews_url: string | null;
  initial_review_question: string | null;
  created_at: string;
};

type CompanyRole = "super_admin" | "company_admin" | "viewer";
type AccessRequest = { id: string; full_name: string; company_name: string; document: string; whatsapp: string; email: string; status: "pending" | "approved" | "rejected"; created_at: string };

const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120),
  slug: z.string().trim().min(2, "Informe o slug.").max(60).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  alert_phone: z.string().trim().max(30),
  googleUrl: z.string().trim().url("Informe uma URL válida.").or(z.literal("")),
  initialQuestion: z.string().trim().min(5, "Informe a pergunta inicial.").max(180),
});

const linkSchema = z.object({
  userId: z.string().trim().uuid("Informe o ID do usuário."),
  companyId: z.string().trim().uuid("Selecione a empresa."),
  role: z.enum(["super_admin", "company_admin", "viewer"]),
});

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "empresa";

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [linkingUser, setLinkingUser] = useState(false);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [companyForm, setCompanyForm] = useState({ name: "", slug: "", alert_phone: "", googleUrl: "", initialQuestion: "Como foi sua experiência hoje?" });
  const [newUserForm, setNewUserForm] = useState({ email: "", password: "", companyId: "", role: "viewer" as CompanyRole });
  const [linkForm, setLinkForm] = useState<{ userId: string; companyId: string; role: CompanyRole }>({ userId: "", companyId: "", role: "viewer" });

  const selectedCompany = useMemo(() => companies.find((company) => company.id === linkForm.companyId), [companies, linkForm.companyId]);

  const loadCompanies = async () => {
    const [{ data, error }, requests] = await Promise.all([
      (supabase as any).rpc("get_admin_companies"),
      (supabase as any).rpc("get_access_requests"),
    ]);
    if (error || requests.error) {
      toast.error(error.message || "Acesso negado.");
      navigate("/app", { replace: true });
      return;
    }
    setCompanies(data ?? []);
    setAccessRequests(requests.data ?? []);
    if (!linkForm.companyId && data?.[0]) setLinkForm((current) => ({ ...current, companyId: data[0].id }));
    if (!newUserForm.companyId && data?.[0]) setNewUserForm((current) => ({ ...current, companyId: data[0].id }));
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      await loadCompanies();
      setLoading(false);
    };
    init();
  }, [navigate]);

  const createCompany = async () => {
    const parsed = companySchema.safeParse(companyForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os dados.");
      return;
    }
    setSavingCompany(true);
    const { error } = await (supabase as any).rpc("admin_create_company", {
      _name: parsed.data.name,
      _slug: parsed.data.slug,
      _alert_phone: parsed.data.alert_phone || null,
      _google_url: parsed.data.googleUrl || null,
      _initial_question: parsed.data.initialQuestion,
    });
    setSavingCompany(false);
    if (error) {
      toast.error(error.message || "Não foi possível criar a empresa.");
      return;
    }
    toast.success("Empresa criada.");
    setCompanyForm({ name: "", slug: "", alert_phone: "", googleUrl: "", initialQuestion: "Como foi sua experiência hoje?" });
    await loadCompanies();
  };

  const linkUser = async () => {
    const parsed = linkSchema.safeParse(linkForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os dados.");
      return;
    }
    setLinkingUser(true);
    const { error } = await (supabase as any).rpc("admin_link_user_to_company", {
      _user_id: parsed.data.userId,
      _company_id: parsed.data.companyId,
      _role: parsed.data.role,
    });
    setLinkingUser(false);
    if (error) {
      toast.error(error.message || "Não foi possível vincular o usuário.");
      return;
    }
    toast.success("Usuário vinculado.");
    setLinkForm((current) => ({ ...current, userId: "", role: "viewer" }));
  };

  const createUser = async () => {
    if (!newUserForm.email.includes("@") || newUserForm.password.length < 6 || !newUserForm.companyId) {
      toast.error("Informe email, senha e empresa.");
      return;
    }
    setLinkingUser(true);
    const { error } = await supabase.functions.invoke("admin-create-user", { body: { email: newUserForm.email, password: newUserForm.password, company_id: newUserForm.companyId, role: newUserForm.role } });
    setLinkingUser(false);
    if (error) {
      toast.error(error.message || "Não foi possível criar o usuário.");
      return;
    }
    toast.success("Usuário criado e vinculado.");
    setNewUserForm((current) => ({ ...current, email: "", password: "", role: "viewer" }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">SaaS multi-clientes</p>
            <h1 className="text-xl font-bold leading-tight">Super admin</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="hero"><Link to="/admin/empresas"><Building2 className="h-4 w-4" /> Empresas</Link></Button>
            <Button asChild variant="quiet"><Link to="/app">Área cliente</Link></Button>
            <Button variant="quiet" size="icon" onClick={signOut} aria-label="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg bg-card p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></div>
            <h2 className="text-2xl font-bold">Criar empresa</h2>
          </div>
          <div className="grid gap-3">
            <Input value={companyForm.name} onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder="Nome da empresa" className="h-12 rounded-lg" />
            <Input value={companyForm.slug} onChange={(e) => setCompanyForm((f) => ({ ...f, slug: slugify(e.target.value) }))} placeholder="slug-publico" className="h-12 rounded-lg" />
            <Input value={companyForm.alert_phone} onChange={(e) => setCompanyForm((f) => ({ ...f, alert_phone: e.target.value }))} placeholder="Telefone de alerta" className="h-12 rounded-lg" />
            <Input value={companyForm.googleUrl} onChange={(e) => setCompanyForm((f) => ({ ...f, googleUrl: e.target.value }))} placeholder="URL de review do Google" className="h-12 rounded-lg" />
            <Textarea value={companyForm.initialQuestion} onChange={(e) => setCompanyForm((f) => ({ ...f, initialQuestion: e.target.value }))} placeholder="Pergunta inicial" className="min-h-24 rounded-lg" />
            <Button variant="hero" size="touch" onClick={createCompany} disabled={savingCompany}>{savingCompany && <Loader2 className="h-4 w-4 animate-spin" />} Criar empresa</Button>
          </div>
        </section>

        <section className="rounded-lg bg-card p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><UserPlus className="h-5 w-5" /></div>
            <h2 className="text-2xl font-bold">Criar usuário</h2>
          </div>
          <div className="grid gap-3">
            <Input value={newUserForm.email} onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-12 rounded-lg" />
            <Input value={newUserForm.password} onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))} type="password" placeholder="Senha inicial" className="h-12 rounded-lg" />
            <Select value={newUserForm.companyId} onValueChange={(value) => setNewUserForm((f) => ({ ...f, companyId: value }))}>
              <SelectTrigger className="h-12 rounded-lg"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm((f) => ({ ...f, role: value as CompanyRole }))}>
              <SelectTrigger className="h-12 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="viewer">Viewer</SelectItem><SelectItem value="company_admin">Company admin</SelectItem><SelectItem value="super_admin">Super admin</SelectItem></SelectContent>
            </Select>
            <Button variant="hero" size="touch" onClick={createUser} disabled={linkingUser}>{linkingUser && <Loader2 className="h-4 w-4 animate-spin" />} Criar e vincular</Button>
            <div className="my-2 h-px bg-border" />
            <Input value={linkForm.userId} onChange={(e) => setLinkForm((f) => ({ ...f, userId: e.target.value }))} placeholder="ID do usuário" className="h-12 rounded-lg" />
            <Select value={linkForm.companyId} onValueChange={(value) => setLinkForm((f) => ({ ...f, companyId: value }))}>
              <SelectTrigger className="h-12 rounded-lg"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={linkForm.role} onValueChange={(value) => setLinkForm((f) => ({ ...f, role: value as CompanyRole }))}>
              <SelectTrigger className="h-12 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="viewer">Viewer</SelectItem><SelectItem value="company_admin">Company admin</SelectItem><SelectItem value="super_admin">Super admin</SelectItem></SelectContent>
            </Select>
            <Button variant="hero" size="touch" onClick={linkUser} disabled={linkingUser || !selectedCompany}>{linkingUser && <Loader2 className="h-4 w-4 animate-spin" />} Vincular</Button>
          </div>
        </section>

        <section className="rounded-lg bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><ClipboardList className="h-5 w-5" /></div>
            <h2 className="text-2xl font-bold">Solicitações de acesso</h2>
          </div>
          <div className="grid gap-3">
            {accessRequests.length === 0 ? <p className="rounded-lg bg-muted p-4 text-muted-foreground">Nenhuma solicitação recebida.</p> : accessRequests.map((request) => (
              <div key={request.id} className="grid gap-3 rounded-lg bg-muted p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                <div>
                  <p className="font-bold">{request.full_name}</p>
                  <p className="text-sm text-muted-foreground">{request.company_name} · {request.document}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{request.email}</p>
                  <p>{request.whatsapp}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{request.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground"><Building2 className="h-5 w-5" /></div>
            <h2 className="text-2xl font-bold">Empresas</h2>
          </div>
          <div className="grid gap-3">
            {companies.length === 0 ? <p className="rounded-lg bg-muted p-4 text-muted-foreground">Nenhuma empresa cadastrada.</p> : companies.map((company) => (
              <div key={company.id} className="grid gap-3 rounded-lg bg-muted p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                <div><p className="font-bold">{company.name}</p><p className="text-sm text-muted-foreground">/avaliar/{company.slug}</p></div>
                <div className="text-sm text-muted-foreground">{company.initial_review_question || "—"}</div>
                <Button asChild variant="quiet"><Link to={`/app?company=${company.id}`}><Shield className="h-4 w-4" /> Acessar painel</Link></Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminPage;
