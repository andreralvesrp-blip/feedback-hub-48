import { useEffect, useState } from "react";
import { BarChart3, Calendar, Loader2, ShieldCheck } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Metrics = {
  company_name: string;
  nps: number;
  total_responses: number;
  budget_requests: number;
  negative_feedbacks: number;
  google_redirects: number;
};

const PublicPanel = () => {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const [month, setMonth] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any).rpc("get_public_panel_metrics", {
        _slug: slug,
        _token: params.get("token") || "",
        _month: month ? `${month}-01` : null,
      });
      if (!active) return;
      setMetrics(data?.[0] ?? null);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [slug, params, month]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;

  if (!metrics) {
    return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div className="rounded-3xl bg-card p-6 shadow-soft"><h1 className="text-2xl font-black">Painel indisponível</h1><p className="mt-2 text-muted-foreground">Token inválido ou empresa não encontrada.</p></div></main>;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] bg-gradient-hero p-6 text-surface-strong-foreground shadow-glow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-surface-strong-foreground/70">Dashboard público</p>
              <h1 className="mt-1 text-3xl font-black leading-tight">{metrics.company_name}</h1>
              <p className="mt-3 max-w-lg text-sm text-surface-strong-foreground/76">Métricas agregadas sem dados pessoais.</p>
            </div>
            <ShieldCheck className="h-9 w-9 text-accent" />
          </div>
        </header>

        <div className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
          <Calendar className="h-5 w-5 text-primary" />
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-12 rounded-2xl" />
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["NPS", metrics.nps],
            ["Total respostas", metrics.total_responses],
            ["Orçamentos", metrics.budget_requests],
            ["Feedbacks negativos", metrics.negative_feedbacks],
            ["Direcionamentos Google", metrics.google_redirects],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl bg-card p-5 shadow-soft">
              <BarChart3 className="mb-4 h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-black">{String(value)}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default PublicPanel;
