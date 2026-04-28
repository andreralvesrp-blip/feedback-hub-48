import { ArrowRight, BarChart3, CheckCircle2, MessageCircle, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const steps = [
    "Cliente escaneia o QR Code",
    "Responde em menos de 60 segundos",
    "Quem gostou vai para o Google",
    "Quem quer orçamento deixa contato",
  ];

  const benefits = [
    "Mais avaliações no Google automaticamente",
    "Mais pedidos de orçamento sem esforço",
    "Feedback real dos clientes",
    "Tudo organizado em um painel simples",
  ];

  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-hero text-foreground">
        <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-background/15 backdrop-blur">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Captura Eventos</p>
                <p className="text-xs text-surface-strong-foreground/70">Experiência, Google e orçamentos</p>
              </div>
            </div>
            <Button asChild variant="quiet" size="sm">
              <Link to="/login">Entrar</Link>
            </Button>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="animate-soft-rise space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                QR Code para eventos e empresas locais
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.02] tracking-normal sm:text-6xl">
                  Transforme convidados em avaliações no Google e novos clientes.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Capture feedback em segundos via QR Code no evento e gere mais avaliações e pedidos de orçamento automaticamente.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="warm" size="touch">
                  <Link to="/app">
                    Começar agora <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="quiet" size="touch">
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>
            </div>

            <div className="animate-soft-rise rounded-lg border border-border bg-card p-4 shadow-soft [animation-delay:120ms]">
              <div className="rounded-lg bg-card p-4 text-card-foreground shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-2xl font-bold">Experiência 84%</p>
                  </div>
                  <div className="rounded-lg bg-brand-soft p-3 text-primary">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["128", "respostas"],
                    ["41", "orçamentos"],
                    ["73", "Google"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-xl font-bold">{value}</p>
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
                    <div key={String(title)} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
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

      <section className="bg-background px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-5">
          <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
            Cada evento gera dezenas de oportunidades — e você perde todas.
          </h2>
          <div className="max-w-2xl space-y-4 text-lg leading-8 text-muted-foreground">
            <p>A cada evento, dezenas de pessoas passam pela sua empresa.</p>
            <p>Elas vão embora sem deixar avaliação, sem virar contato e sem gerar novos negócios.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-surface px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-9">
          <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
            Simples: um QR Code no evento resolve isso.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
                <div className="mb-5 grid h-10 w-10 place-items-center rounded-md bg-secondary text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <p className="text-base font-bold leading-6">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-start gap-3 rounded-lg border border-border bg-card p-5 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-base font-bold leading-6 text-card-foreground">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface px-5 py-16 text-foreground sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
            Comece a capturar valor dos seus eventos hoje
          </h2>
          <Button asChild variant="warm" size="touch" className="shrink-0">
            <Link to="/app">
              Criar minha empresa <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
