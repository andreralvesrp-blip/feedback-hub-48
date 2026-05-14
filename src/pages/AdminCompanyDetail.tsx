import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Loader2, MessageSquare, Settings, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  slug: string;
  alert_phone: string | null;
  google_reviews_url: string | null;
  initial_review_question: string | null;
  created_at: string;
  responses_count: number;
  leads_count: number;
  users_count: number;
  google_clicks_count: number;
};

type Response = {
  id: string;
  created_at: string;
  experience_rating: "loved" | "ok" | "improve";
  comment: string | null;
  name: string | null;
  whatsapp: string | null;
  wants_google_review: boolean;
  redirected_to_google: boolean;
};

type Lead = {
  id: string;
  created_at: string;
  name: string;
  whatsapp: string;
  interest: string;
  experience_rating: string | null;
  status: string;
};

type CompanyUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: "super_admin" | "company_admin" | "viewer";
  linked_at: string;
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const ratingMap: Record<string, { label: string; cls: string }> = {
  loved: { label: "Adorei", cls: "bg-emerald-100 text-emerald-700" },
  ok: { label: "Foi ok", cls: "bg-amber-100 text-amber-700" },
  improve: { label: "Não gostei", cls: "bg-rose-100 text-rose-700" },
};

const AdminCompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<CompanyUser[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!companyId) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const [overviewRes, respRes, leadRes, usersRes] = await Promise.all([
        (supabase as any).rpc("get_admin_companies_overview"),
        supabase
          .from("experience_responses")
          .select("id, created_at, experience_rating, comment, name, whatsapp, wants_google_review, redirected_to_google")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("budget_requests")
          .select("id, created_at, name, whatsapp, interest, experience_rating, status")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        (supabase as any).rpc("get_admin_company_users", { _company_id: companyId }),
      ]);

      if (overviewRes.error) {
        toast.error(overviewRes.error.message || "Acesso negado.");
        navigate("/admin/empresas", { replace: true });
        return;
      }
      const found = (overviewRes.data ?? []).find((c: Company) => c.id === companyId);
      if (!found) {
        toast.error("Empresa não encontrada.");
        navigate("/admin/empresas", { replace: true });
        return;
      }
      setCompany(found);
      setResponses((respRes.data as Response[]) ?? []);
      setLeads((leadRes.data as Lead[]) ?? []);
      setUsers((usersRes.data as CompanyUser[]) ?? []);
      setLoading(false);
    };
    init();
  }, [companyId, navigate]);

  const conversion = useMemo(() => {
    if (!company || company.responses_count === 0) return 0;
    return Math.round((company.leads_count / company.responses_count) * 100);
  }, [company]);

  if (loading || !company)
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/admin/empresas" className="hover:text-foreground">Empresas</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">{company.name}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{company.name}</h1>
              <p className="text-sm text-muted-foreground">/{company.slug} · criada em {fmtDate(company.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="quiet"><Link to={`/avaliar/${company.slug}`} target="_blank">Página pública</Link></Button>
              <Button asChild variant="quiet"><Link to="/admin/empresas">Voltar</Link></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="responses">Respostas</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="google">Google Reviews</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-5 grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={<MessageSquare className="h-4 w-4" />} label="Respostas" value={company.responses_count} />
              <Stat icon={<Users className="h-4 w-4" />} label="Leads" value={company.leads_count} />
              <Stat icon={<Star className="h-4 w-4" />} label="Cliques Google" value={company.google_clicks_count} />
              <Stat icon={<Settings className="h-4 w-4" />} label="Conversão respostas → leads" value={`${conversion}%`} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Últimas respostas">
                {responses.slice(0, 5).length === 0 ? (
                  <Empty>Sem respostas ainda.</Empty>
                ) : (
                  <ul className="grid gap-2">
                    {responses.slice(0, 5).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.name || "Anônimo"}</p>
                          <p className="truncate text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${ratingMap[r.experience_rating]?.cls}`}>
                          {ratingMap[r.experience_rating]?.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
              <Panel title="Últimos leads">
                {leads.slice(0, 5).length === 0 ? (
                  <Empty>Sem leads ainda.</Empty>
                ) : (
                  <ul className="grid gap-2">
                    {leads.slice(0, 5).map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{l.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{l.whatsapp} · {l.interest}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(l.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </TabsContent>

          {/* RESPONSES */}
          <TabsContent value="responses" className="mt-5">
            <Panel title={`Respostas (${responses.length})`}>
              {responses.length === 0 ? (
                <Empty>Sem respostas para esta empresa.</Empty>
              ) : (
                <div className="grid gap-2">
                  {responses.map((r) => (
                    <div key={r.id} className="grid gap-2 rounded-md bg-muted p-3 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ratingMap[r.experience_rating]?.cls}`}>
                            {ratingMap[r.experience_rating]?.label}
                          </span>
                          {(r.redirected_to_google || r.wants_google_review) && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">Clicou Google</span>
                          )}
                          <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
                        </div>
                        <p className="text-sm font-semibold">{r.name || "Anônimo"} {r.whatsapp ? `· ${r.whatsapp}` : ""}</p>
                        {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* LEADS */}
          <TabsContent value="leads" className="mt-5">
            <Panel title={`Leads (${leads.length})`}>
              {leads.length === 0 ? (
                <Empty>Sem leads para esta empresa.</Empty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">WhatsApp</th>
                        <th className="px-3 py-2">Interesse</th>
                        <th className="px-3 py-2">Experiência</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="px-3 py-2 text-muted-foreground">{fmtDateTime(l.created_at)}</td>
                          <td className="px-3 py-2 font-semibold">{l.name}</td>
                          <td className="px-3 py-2">{l.whatsapp}</td>
                          <td className="px-3 py-2">{l.interest}</td>
                          <td className="px-3 py-2">{l.experience_rating ? ratingMap[l.experience_rating]?.label || "—" : "—"}</td>
                          <td className="px-3 py-2"><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* GOOGLE */}
          <TabsContent value="google" className="mt-5">
            <Panel title={`Cliques para Google Review (${company.google_clicks_count})`}>
              {(() => {
                const clicks = responses.filter((r) => r.redirected_to_google || r.wants_google_review);
                if (clicks.length === 0) return <Empty>Nenhum clique registrado.</Empty>;
                return (
                  <div className="grid gap-2">
                    {clicks.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.name || "Anônimo"} {r.whatsapp ? `· ${r.whatsapp}` : ""}</p>
                          <p className="truncate text-xs text-muted-foreground">{fmtDateTime(r.created_at)} · resposta: {ratingMap[r.experience_rating]?.label}</p>
                        </div>
                        {company.google_reviews_url && (
                          <a href={company.google_reviews_url} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-primary hover:underline">
                            Abrir destino ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Panel>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="mt-5">
            <Panel title={`Usuários vinculados (${users.length})`}>
              {users.length === 0 ? (
                <Empty>Nenhum usuário vinculado.</Empty>
              ) : (
                <div className="grid gap-2">
                  {users.map((u) => (
                    <div key={u.user_id} className="grid gap-2 rounded-md bg-muted p-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.full_name || u.email || u.user_id}</p>
                        {u.email && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">{u.role}</span>
                      <span className="text-xs text-muted-foreground">vinculado em {fmtDate(u.linked_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-5">
            <Panel title="Configurações">
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome" value={company.name} />
                <Field label="Slug" value={`/${company.slug}`} />
                <Field label="Telefone de alerta" value={company.alert_phone || "—"} />
                <Field label="Pergunta inicial" value={company.initial_review_question || "—"} />
                <Field
                  label="Link Google Reviews"
                  value={company.google_reviews_url || "—"}
                  href={company.google_reviews_url || undefined}
                />
                <Field label="Criada em" value={fmtDate(company.created_at)} />
              </dl>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="rounded-lg bg-card p-4 shadow-soft">
    <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg bg-card p-5 shadow-soft">
    <h2 className="mb-4 text-lg font-bold">{title}</h2>
    {children}
  </section>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">{children}</p>
);

const Field = ({ label, value, href }: { label: string; value: string; href?: string }) => (
  <div className="rounded-md bg-muted p-3">
    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-all text-sm font-semibold">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">{value}</a>
      ) : (
        value
      )}
    </dd>
  </div>
);

export default AdminCompanyDetail;
