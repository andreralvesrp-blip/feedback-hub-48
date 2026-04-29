import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  MessageCircle,
  QrCode,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type LeadForm = {
  name: string;
  companyName: string;
  whatsapp: string;
};

type LeadFormErrors = Partial<Record<keyof LeadForm, string>>;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const formatWhatsapp = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  const ddd = digits.slice(0, 2);
  const firstPart = digits.slice(2, 7);
  const secondPart = digits.slice(7, 11);

  if (digits.length <= 2) return ddd ? `(${ddd}` : "";
  if (digits.length <= 7) return `(${ddd}) ${firstPart}`;
  return `(${ddd}) ${firstPart}-${secondPart}`;
};

const isValidFullName = (name: string) => {
  const cleanName = normalizeText(name);
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'-]{2,}( [A-Za-zÀ-ÖØ-öø-ÿ'-]{2,})+$/.test(cleanName);
};

const isValidBrazilianMobile = (value: string) => {
  const digits = onlyDigits(value);
  const ddd = Number(digits.slice(0, 2));
  const lastEight = digits.slice(3);
  const lastNine = digits.slice(2);

  return (
    digits.length === 11 &&
    ddd >= 11 &&
    ddd <= 99 &&
    digits[2] === "9" &&
    !/^(\d)\1{10}$/.test(digits) &&
    !/^(\d)\1{7}$/.test(lastEight) &&
    !/^(\d)\1{8}$/.test(lastNine)
  );
};

const Index = () => {
  const [leadForm, setLeadForm] = useState<LeadForm>({ name: "", companyName: "", whatsapp: "" });
  const [leadErrors, setLeadErrors] = useState<LeadFormErrors>({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const validateLeadForm = () => {
    const errors: LeadFormErrors = {};
    const cleanCompanyName = normalizeText(leadForm.companyName);

    if (!isValidFullName(leadForm.name)) {
      errors.name = "Informe nome e sobrenome.";
    }

    if (cleanCompanyName.length < 3) {
      errors.companyName = "Informe o nome da empresa.";
    }

    if (!isValidBrazilianMobile(leadForm.whatsapp)) {
      errors.whatsapp = "Informe um WhatsApp válido.";
    }

    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingLead || !validateLeadForm()) return;

    setIsSubmittingLead(true);

    const { error } = await supabase.from("home_leads" as never).insert({
      name: normalizeText(leadForm.name),
      company_name: normalizeText(leadForm.companyName),
      whatsapp: onlyDigits(leadForm.whatsapp),
    } as never);

    setIsSubmittingLead(false);

    if (error) {
      setLeadErrors({ whatsapp: "Não foi possível enviar agora. Tente novamente." });
      return;
    }

    setLeadForm({ name: "", companyName: "", whatsapp: "" });
    setLeadSubmitted(true);
  };

  const problemCards = [
    ["Sem contato", "Pessoas interessadas vão embora sem deixar nome ou WhatsApp."],
    ["Sem avaliação", "Clientes satisfeitos não são direcionados para o Google no momento certo."],
    ["Sem feedback privado", "Problemas que poderiam ser tratados internamente podem virar reclamações públicas."],
  ];

  const productPillars = [
    { icon: Users, title: "Contatos", text: "Capture nome e WhatsApp de quem quer falar com a empresa." },
    { icon: Star, title: "Google", text: "Direcione clientes satisfeitos para sua página de avaliação." },
    { icon: MessageCircle, title: "Feedback", text: "Receba críticas e sugestões em um canal privado." },
  ];

  const steps = [
    ["A empresa configura o QR Code", "Define pergunta inicial, telefone de alerta e link de avaliação do Google."],
    ["O QR Code fica visível no evento", "Pode estar na saída, mesa, balcão, recepção, totens ou materiais impressos."],
    ["O convidado responde em segundos", "Ele escolhe entre “Adorei”, “Foi ok” ou “Não gostei”."],
    ["A plataforma direciona a intenção", "Quem gostou pode avaliar no Google. Quem quer orçamento deixa contato. Quem teve problema envia feedback privado."],
    ["O dono recebe oportunidades no WhatsApp", "Cada novo pedido de orçamento chega direto no telefone configurado pela empresa."],
  ];

  const capturedAssets = [
    ["Base de contatos", "Pessoas interessadas deixam nome e WhatsApp para receber orçamento ou falar com a equipe.", "Quero orçamento para uma festa em junho"],
    ["Reputação pública", "Clientes satisfeitos são direcionados para avaliar no Google no momento mais favorável.", "Adorei a experiência do evento"],
    ["Aprendizado privado", "Feedbacks sensíveis chegam diretamente para a empresa, sem exposição pública desnecessária.", "A fila da entrada poderia ser mais rápida"],
  ];

  const audiences = [
    "Buffets infantis",
    "Espaços de festa",
    "Casas de evento",
    "Fornecedores de casamento",
    "Fotógrafos e filmakers",
    "Recreadores e personagens",
    "Decoração e cerimonial",
    "Carrinhos gourmet e ativações",
    "Eventos corporativos",
  ];

  const panelFeatures = [
    { icon: Sparkles, label: "Índice de experiência" },
    { icon: FileText, label: "Respostas por período" },
    { icon: MessageCircle, label: "Lista de feedbacks" },
    { icon: Bell, label: "Pedidos de orçamento" },
    { icon: CheckCircle2, label: "Status do lead" },
    { icon: Download, label: "Exportação CSV" },
    { icon: QrCode, label: "QR Code da empresa" },
    { icon: LayoutDashboard, label: "Configurações da empresa" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3" aria-label="Captura Eventos">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-primary shadow-soft">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Captura Eventos</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#produto">Produto</a>
            <a className="transition-colors hover:text-foreground" href="#como-funciona">Como funciona</a>
            <a className="transition-colors hover:text-foreground" href="#para-quem">Para quem é</a>
          </nav>

          <Button asChild variant="quiet" size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="overflow-hidden px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-7">
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-normal sm:text-6xl lg:text-7xl">
                Transforme convidados em <span className="block">novos clientes</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Nossa plataforma te ajuda a gerar orçamentos, aumentar avaliações no Google e ter feedbacks para melhoria.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="warm" size="touch">
                <Link to="/solicitar-acesso">
                  Solicitar acesso <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="quiet" size="touch">
                <a href="#produto">Entender o produto</a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 -top-8 h-24 rounded-full bg-brand-soft blur-3xl" />
            <div className="relative rounded-lg border border-border bg-card p-4 shadow-soft">
              <div className="rounded-lg border border-border bg-background p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Exemplo de fluxo</p>
                    <p className="mt-1 text-2xl font-bold">Evento em andamento</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-primary">
                    <QrCode className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-3">
                  {flowCards.map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-6">{title}</p>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="max-w-4xl space-y-6">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              Cada evento cria uma rede. Poucas empresas capturam essa rede.
            </h2>
            <p className="text-xl leading-9 text-muted-foreground">
              Um evento não reúne apenas convidados. Ele reúne futuros clientes, indicadores, famílias, amigos, empresas e pessoas que acabaram de viver sua experiência.
            </p>
            <p className="text-xl leading-9 text-muted-foreground">
              O problema é que, na maioria das vezes, essa rede se dispersa assim que o evento termina.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 text-2xl font-bold leading-snug shadow-soft sm:p-8 sm:text-3xl">
            O evento acaba. A oportunidade não deveria acabar junto.
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              A oportunidade está ali — mas vai embora sem deixar rastro.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Quem esteve no evento viu sua estrutura, seu atendimento, sua comida, sua organização e sua entrega acontecendo em tempo real. Mas se ninguém captura esse momento, tudo vira lembrança. Não vira contato. Não vira avaliação. Não vira orçamento.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {problemCards.map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-bold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
                Uma camada simples de captura para cada evento.
              </h2>
            </div>
            <p className="text-lg leading-8 text-muted-foreground">
              A plataforma cria um QR Code para a empresa usar no evento. O convidado responde em segundos. A partir da resposta, o sistema organiza cada intenção: orçamento, avaliação no Google ou feedback privado.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {productPillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-6 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-surface px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">Como funciona na prática</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Sem aplicativo, sem login para o convidado e sem complicar a operação do evento.
            </p>
          </div>
          <div className="space-y-4">
            {steps.map(([title, text], index) => (
              <div key={title} className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-sm sm:grid-cols-[3rem_1fr] sm:items-start">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-7">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              O que antes se perdia, agora vira ativo.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Cada evento pode alimentar três ativos importantes para o negócio.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {capturedAssets.map(([title, text, example]) => (
              <div key={title} className="flex min-h-full flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
                <div>
                  <h3 className="text-xl font-bold leading-7">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
                <div className="mt-8 rounded-lg bg-muted p-4 text-sm font-medium leading-6 text-foreground">
                  “{example}”
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="para-quem" className="bg-surface px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              Para negócios que vivem de experiência presencial.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              A plataforma faz sentido para empresas que recebem pessoas, entregam experiências e dependem de indicação, reputação e novos orçamentos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {audiences.map((audience) => (
              <span key={audience} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
                {audience}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              Tudo organizado em um painel simples.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              A empresa acompanha respostas, pedidos de orçamento, intenção de avaliação no Google e feedbacks em um único lugar.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
            <div className="rounded-lg border border-border bg-background p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Painel da empresa</p>
                  <p className="text-xl font-bold">Dados de exemplo</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-primary">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {panelFeatures.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold leading-5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-8 text-center shadow-soft sm:p-12">
          <div className="mx-auto max-w-3xl space-y-5">
            <h2 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">
              Seu evento já gera atenção. Agora transforme isso em oportunidade.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Capture contatos, avaliações e feedbacks de quem acabou de viver sua experiência.
            </p>
            <div className="pt-2">
              <Button asChild variant="warm" size="touch">
                <Link to="/solicitar-acesso">
                  Solicitar acesso <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Acesso liberado manualmente para empresas em teste.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
