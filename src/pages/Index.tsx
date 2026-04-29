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
    { icon: CheckCircle2, title: "Cliente satisfeito", subtitle: "Pode avaliar sua empresa no Google" },
    { icon: ShieldCheck, title: "Feedback privado", subtitle: "Problemas chegam direto para a empresa" },
  ];

  const benefits = [
    "Capture contatos de convidados e clientes interessados",
    "Receba novos pedidos de orçamento no WhatsApp",
    "Aumente suas avaliações no Google",
    "Ouça feedbacks privados antes que virem reclamações públicas",
    "Veja tudo em um painel simples por empresa",
    "Aproveite melhor cada evento sem depender só de anúncios ou Instagram",
  ];

  const solutionSteps = [
    ["O convidado escaneia o QR Code", "Em poucos segundos, ele avalia como foi a experiência."],
    ["Quem gostou pode avaliar no Google", "Clientes satisfeitos são direcionados para sua página de avaliação."],
    ["Quem quer falar com a empresa deixa contato", "Nome e WhatsApp chegam organizados no painel."],
    ["O dono recebe o pedido no WhatsApp", "Quando entra um novo orçamento, a empresa é avisada na hora."],
  ];

  const audiences = [
    "Buffets infantis",
    "Espaços de festa",
    "Casas de evento",
    "Fornecedores de casamento",
    "Fotógrafos, recreadores e decoradores",
    "Carrinhos gourmet e ativações",
    "Eventos corporativos",
  ];

  const practicalSteps = [
    ["Você configura sua empresa", "Adiciona nome, telefone para receber orçamentos, link de avaliação do Google e pergunta inicial."],
    ["A plataforma gera um QR Code", "Você imprime ou exibe o QR Code no evento."],
    ["O convidado responde em segundos", "Ele escolhe entre “Adorei”, “Foi ok” ou “Não gostei”."],
    ["A plataforma direciona cada resposta", "Quem gostou pode ir para o Google. Quem quer contato vira orçamento. Quem teve problema envia feedback privado."],
    ["Você acompanha tudo no painel", "Respostas, orçamentos, avaliações e dados ficam organizados por empresa."],
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
                QR Code para eventos, avaliações e novos orçamentos
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-normal sm:text-6xl">
                  Transforme convidados em novos pedidos de orçamento.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  Com um QR Code no evento, você captura contatos de pessoas que já viveram sua experiência, recebe alertas no WhatsApp e ainda direciona clientes satisfeitos para avaliar sua empresa no Google.
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
            <Link to="/solicitar-acesso">
              Criar minha empresa <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
