import { ArrowRight, BarChart3, CheckCircle2, MessageCircle, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const dashboardHighlights = [
    { icon: MessageCircle, label: "Orçamentos" },
    { icon: CheckCircle2, label: "Avaliações" },
    { icon: ShieldCheck, label: "Feedbacks" },
  ];

  const dashboardEvents = [
    { icon: MessageCircle, title: "Novo pedido de orçamento", subtitle: "Contato chega no painel e no WhatsApp" },
    { icon: CheckCircle2, title: "Avaliação no Google", subtitle: "Cliente satisfeito segue para avaliar" },
    { icon: ShieldCheck, title: "Feedback privado", subtitle: "Problemas chegam direto para a empresa" },
  ];

  const flowSteps = [
    ["QR Code no evento", "O convidado escaneia e responde em poucos segundos."],
    ["Contato capturado", "Quem quer orçamento deixa nome e WhatsApp."],
    ["Alerta no WhatsApp", "O dono recebe cada novo pedido na hora."],
    ["Google e feedback", "Clientes satisfeitos vão para o Google. Feedbacks sensíveis ficam privados."],
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
                <p className="text-xs text-muted-foreground">Eventos, contatos e oportunidades</p>
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
                QR Code para eventos, contatos e oportunidades
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-normal sm:text-6xl">
                  Transforme convidados em novos pedidos de orçamento.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Seu evento já reúne potenciais clientes. Com um QR Code, você captura contatos, recebe cada novo pedido direto no WhatsApp e ainda direciona clientes satisfeitos para avaliar no Google.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="warm" size="touch">
                  <Link to="/solicitar-acesso">
                    Solicitar acesso <ArrowRight className="h-5 w-5" />
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
                    <p className="text-sm text-muted-foreground">Exemplo de painel</p>
                    <p className="text-2xl font-bold">Evento em andamento</p>
                  </div>
                  <div className="rounded-lg bg-brand-soft p-3 text-primary">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {dashboardHighlights.map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-lg bg-muted p-3 text-center">
                      <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {dashboardEvents.map(({ icon: Icon, title, subtitle }) => (
                    <div key={title} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{title}</p>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
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
            Você já tem potenciais clientes dentro do evento.
          </h2>
          <div className="max-w-2xl space-y-4 text-lg leading-8 text-muted-foreground">
            <p>Eles veem sua entrega ao vivo, conhecem sua estrutura e vivem a experiência.</p>
            <p>Mas, na maioria das vezes, vão embora sem deixar contato, sem pedir orçamento e sem avaliar no Google.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-5">
          <h2 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
            Antes de gastar mais para atrair gente nova, capture melhor quem já está na sua frente.
          </h2>
          <div className="max-w-2xl space-y-4 text-lg leading-8 text-muted-foreground">
            <p>Anúncios e Instagram ajudam, mas não deveriam ser sua única fonte de novos clientes.</p>
            <p>Cada evento é uma vitrine ao vivo — e pode virar uma base de contatos, avaliações e oportunidades.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-background px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-9">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal text-foreground sm:text-4xl">
              Como funciona
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Um QR Code simples transforma a atenção do evento em contato, avaliação e oportunidade.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map(([title, text], index) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
                <div className="mb-5 grid h-10 w-10 place-items-center rounded-md bg-secondary text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <h3 className="text-base font-bold leading-6">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 text-foreground sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
              O evento acaba. As oportunidades não.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Capture contatos, avaliações e pedidos de orçamento nos seus eventos — sem depender só de anúncios ou Instagram.
            </p>
            <p className="text-sm font-semibold leading-6 text-foreground">
              Ideal para buffets, espaços de festa, casas de evento, fornecedores, carrinhos gourmet e eventos corporativos.
            </p>
          </div>
          <Button asChild variant="warm" size="touch" className="shrink-0">
            <Link to="/solicitar-acesso">
              Solicitar acesso <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
