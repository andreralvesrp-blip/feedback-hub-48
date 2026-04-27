import { ArrowRight, BarChart3, CheckCircle2, MessageCircle, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-hero text-surface-strong-foreground">
        <div className="absolute inset-x-6 top-8 h-1 rounded-full bg-accent/70 animate-scan-line motion-reduce:animate-none" />
        <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-background/15 backdrop-blur">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Captura Eventos</p>
                <p className="text-xs text-surface-strong-foreground/70">NPS, Google e orçamentos</p>
              </div>
            </div>
            <Button asChild variant="quiet" size="sm" className="bg-background/15 text-surface-strong-foreground hover:bg-background/20">
              <Link to="/app">Entrar</Link>
            </Button>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="animate-soft-rise space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/14 px-4 py-2 text-sm font-medium text-surface-strong-foreground/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-accent" />
                Respostas em menos de 60 segundos
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-normal sm:text-6xl">
                  Transforme cada QR Code em avaliação, melhoria e orçamento.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-surface-strong-foreground/78">
                  Uma plataforma mobile-first para empresas locais coletarem NPS, direcionarem clientes satisfeitos ao Google e receberem pedidos de orçamento sem fricção.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="warm" size="touch">
                  <Link to="/app">
                    Criar minha empresa <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="quiet" size="touch" className="bg-background/12 text-surface-strong-foreground hover:bg-background/18">
                  <Link to="/avaliar/demo-eventos">Ver fluxo público</Link>
                </Button>
              </div>
            </div>

            <div className="animate-soft-rise rounded-[2rem] border border-background/20 bg-background/12 p-4 shadow-glow backdrop-blur-xl [animation-delay:120ms]">
              <div className="rounded-[1.5rem] bg-card p-4 text-card-foreground shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-2xl font-black">NPS 84</p>
                  </div>
                  <div className="rounded-2xl bg-brand-soft p-3 text-primary">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["128", "respostas"],
                    ["41", "orçamentos"],
                    ["73", "Google"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-muted p-3 text-center">
                      <p className="text-xl font-black">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    [CheckCircle2, "Cliente feliz", "Redirecionado para avaliar no Google"],
                    [MessageCircle, "Novo orçamento", "Casamento · chamar no WhatsApp"],
                    [ShieldCheck, "Feedback privado", "Sugestão enviada só para a empresa"],
                  ].map(([Icon, title, subtitle]) => (
                    <div key={String(title)} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{title as string}</p>
                        <p className="text-xs text-muted-foreground">{subtitle as string}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
