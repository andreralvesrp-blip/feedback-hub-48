import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ChevronRight, Loader2, LogOut, MessageSquare, Search, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Overview = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  responses_count: number;
  leads_count: number;
  users_count: number;
  google_clicks_count: number;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const AdminCompanies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Overview[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data, error } = await (supabase as any).rpc("get_admin_companies_overview");
      if (error) {
        toast.error(error.message || "Acesso negado.");
        navigate("/app", { replace: true });
        return;
      }
      setCompanies(data ?? []);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [companies, query]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loading)
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Super admin</p>
            <h1 className="text-xl font-bold leading-tight">Empresas</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="quiet">
              <Link to="/admin">Painel admin</Link>
            </Button>
            <Button asChild variant="quiet">
              <Link to="/app">Área cliente</Link>
            </Button>
            <Button variant="quiet" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5">
        <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou slug"
              className="h-11 rounded-lg pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {companies.length} empresa{companies.length === 1 ? "" : "s"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg bg-card p-8 text-center text-muted-foreground shadow-soft">
            Nenhuma empresa encontrada.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((company) => (
              <Link
                key={company.id}
                to={`/admin/empresas/${company.id}`}
                className="group grid gap-4 rounded-lg bg-card p-5 shadow-soft transition-colors hover:bg-muted/50 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{company.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      /{company.slug} · criada em {fmtDate(company.created_at)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Metric icon={<MessageSquare className="h-4 w-4" />} value={company.responses_count} label="resp." />
                  <Metric icon={<Star className="h-4 w-4" />} value={company.google_clicks_count} label="Google" />
                  <Metric icon={<Users className="h-4 w-4" />} value={company.leads_count} label="leads" />
                  <Metric icon={<Users className="h-4 w-4" />} value={company.users_count} label="users" />
                </div>
                <ChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 lg:block" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const Metric = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <div className="rounded-md bg-muted px-2 py-2">
    <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}</div>
    <p className="mt-1 text-base font-bold leading-none">{value}</p>
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
  </div>
);

export default AdminCompanies;
