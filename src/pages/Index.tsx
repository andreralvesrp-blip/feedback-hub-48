import {
  ArrowRight,
  BarChart3,
  Bell,
  CircleDot,
  ExternalLink,
  FileText,
  MessageCircle,
  QrCode,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type IconType = typeof QrCode;

type CardItem = {
  icon: IconType;
  title: string;
  text: string;
};

const navItems = [
  { label: "Produto", href: "#produto" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para quem é", href: "#para-quem" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Dúvidas", href: "#duvidas" },
];

const liveJourney = [
  { icon: QrCode, label: "Convidado escaneou o QR Code", tone: "bg-brand-soft text-primary" },
  { icon: Star, label: "Resposta: Adorei a experiência", tone: "bg-secondary text-foreground" },
  { icon: ExternalLink, label: "Ação sugerida: Avaliar no Google", tone: "bg-secondary text-primary" },
  { icon: UserPlus, label: "Novo pedido de orçamento recebido", tone: "bg-brand-soft text-primary" },
  { icon: Send, label: "Lead enviado para o WhatsApp", tone: "bg-secondary text-foreground" },
  { icon: ShieldCheck, label: "Feedback privado registrado", tone: "bg-secondary text-foreground" },
];

const problemCards: CardItem[] = [
  {
    icon: UserPlus,
    title: "Sem contato",
    text: "Pessoas interessadas vão embora sem deixar nome ou WhatsApp.",
  },
  {
    icon: Star,
    title: "Sem avaliação",
    text: "Clientes satisfeitos não são direcionados para o Google no momento certo.",
  },
  {
    icon: ShieldCheck,
    title: "Sem feedback privado",
    text: "Problemas que poderiam ser resolvidos internamente podem virar reclamações públicas.",
  },
];

const productPillars: CardItem[] = [
  {
    icon: Users,
    title: "Contatos",
    text: "Capture nome e WhatsApp de quem quer falar com a empresa.",
  },
  {
    icon: Star,
    title: "Google",
    text: "Direcione clientes satisfeitos para sua página de avaliação.",
  },
  {
    icon: MessageCircle,
    title: "Feedback",
    text: "Receba críticas e sugestões em um canal privado.",
  },
];

const steps = [
  {
    title: "A empresa configura o QR Code",
    text: "Define a pergunta inicial, telefone de alerta e link de avaliação do Google.",
  },
  {
    title: "O QR Code fica visível no evento",
    text: "Pode estar na saída, mesa, balcão, recepção, totem ou material impresso.",
  },
  {
    title: "O convidado responde em segundos",
    text: "Ele escolhe entre opções como ‘Adorei’, ‘Foi ok’, ‘Quero orçamento’ ou ‘Não gostei’.",
  },
  {
    title: "A plataforma direciona a intenção",
    text: "Quem gostou pode avaliar no Google. Quem quer orçamento deixa contato. Quem teve problema envia feedback privado.",
  },
  {
    title: "O dono recebe oportunidades no WhatsApp",
    text: "Cada novo pedido ou contato chega direto no telefone configurado pela empresa.",
  },
];

const capturedAssets = [
  {
    icon: Users,
    title: "Base de contatos",
    text: "Pessoas interessadas deixam nome e WhatsApp para receber orçamento ou falar com a equipe.",
    example: "Quero orçamento para uma festa em junho.",
  },
  {
    icon: Star,
    title: "Reputação pública",
    text: "Clientes satisfeitos são direcionados para avaliar no Google no momento mais favorável.",
    example: "Adorei a experiência do evento.",
  },
  {
    icon: MessageCircle,
    title: "Aprendizado privado",
    text: "Feedbacks sensíveis chegam diretamente para a empresa, sem exposição pública desnecessária.",
    example: "A fila da entrada poderia ser mais rápida.",
  },
];

const audiences = [
  ["Buffets infantis", "Pais convidados podem virar os próximos contratantes."],
  ["Espaços de festa", "Cada visita presencial vira chance de reputação e orçamento."],
  ["Casas de evento", "Quem viveu a estrutura pode demonstrar interesse no mesmo dia."],
  ["Fornecedores de casamento", "Convidados e familiares podem pedir contato depois de ver sua entrega."],
  ["Fotógrafos e filmmakers", "Quem viu seu trabalho acontecendo pode solicitar proposta."],
  ["Recreadores e personagens", "Pais que viram a experiência podem pedir orçamento."],
  ["Decoração e cerimonial", "A experiência visual do evento vira porta de entrada para novos clientes."],
  ["Eventos corporativos", "Participantes podem deixar feedback e oportunidades comerciais."],
];

const metrics = [
  ["42", "respostas capturadas"],
  ["18", "interessados em orçamento"],
  ["27", "clientes satisfeitos"],
  ["12", "leads enviados ao WhatsApp"],
  ["5", "feedbacks privados"],
];

const recentResponses = [
  ["Mariana Souza", "Quero orçamento", "WhatsApp enviado"],
  ["Rafael Lima", "Adorei a experiência", "Avaliação sugerida"],
  ["Camila Torres", "Feedback privado", "Registrado"],
];

const scenarios = [
  {
    title: "Buffet infantil",
    text: "Depois da festa, pais convidados escaneiam o QR Code e pedem orçamento para datas futuras.",
  },
  {
    title: "Espaço de eventos",
    text: "Visitantes satisfeitos são direcionados para avaliar no Google enquanto a experiência ainda está fresca.",
  },
  {
    title: "Fornecedor de casamento",
    text: "Quem gostou da entrega deixa contato para receber proposta sem precisar procurar depois.",
  },
];

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const formatWhatsapp = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const isValidBrazilianMobile = (value: string) => {
  const digits = onlyDigits(value);
  const validDdds = new Set([
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24", "27", "28", "31", "32", "33", "34", "35", "37", "38", "41", "42", "43", "44", "45", "46", "47", "48", "49", "51", "53", "54", "55", "61", "62", "63", "64", "65", "66", "67", "68", "69", "71", "73", "74", "75", "77", "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91", "92", "93", "94", "95", "96", "97", "98", "99",
  ]);

  return digits.length === 11 && validDdds.has(digits.slice(0, 2)) && digits[2] === "9" && !/^(\d)\1{10}$/.test(digits);
};

const HomeLeadForm = () => {
  const [leadForm, setLeadForm] = useState({ name: "", companyName: "", whatsapp: "" });
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const updateLeadField = (field: keyof typeof leadForm, value: string) => {
    setLeadForm((current) => ({ ...current, [field]: field === "whatsapp" ? formatWhatsapp(value) : value }));
    setLeadErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateLeadForm = () => {
    const errors: Record<string, string> = {};
    const name = normalizeText(leadForm.name);
    const companyName = normalizeText(leadForm.companyName);

    if (name.split(" ").length < 2 || /\d/.test(name)) errors.name = "Informe nome e sobrenome.";
    if (companyName.length < 2) errors.companyName = "Informe o nome da empresa.";
    if (!isValidBrazilianMobile(leadForm.whatsapp)) errors.whatsapp = "Informe um WhatsApp válido com DDD.";

    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitLeadForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingLead || !validateLeadForm()) return;

    setIsSubmittingLead(true);
    const { error } = await supabase.from("home_leads").insert({
      name: normalizeText(leadForm.name),
      company_name: normalizeText(leadForm.companyName),
      whatsapp: onlyDigits(leadForm.whatsapp),
    });

    setIsSubmittingLead(false);

    if (error) {
      setLeadErrors({ form: "Não foi possível enviar agora. Tente novamente em instantes." });
      return;
    }

    setLeadSubmitted(true);
    setLeadForm({ name: "", companyName: "", whatsapp: "" });
  };

  if (leadSubmitted) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 shadow-soft animate-soft-rise">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-brand-soft text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold leading-tight">Recebemos seu contato.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Em breve vamos falar com você para entender seu evento e tirar suas dúvidas.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submitLeadForm} className="rounded-lg border border-border bg-card p-6 shadow-soft animate-soft-rise sm:p-8">
      <div className="mb-6 space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Teste no seu evento</p>
        <h2 className="text-2xl font-bold leading-tight">Veja como capturar oportunidades na prática.</h2>
        <p className="text-sm leading-6 text-muted-foreground">Deixe seus dados e receba orientação para usar o QR Code em uma experiência real.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="home-lead-name">Nome completo</Label>
          <Input id="home-lead-name" value={leadForm.name} onChange={(event) => updateLeadField("name", event.target.value)} placeholder="Seu nome e sobrenome" autoComplete="name" />
          {leadErrors.name && <p className="text-sm font-medium text-destructive">{leadErrors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="home-lead-company">Empresa</Label>
          <Input id="home-lead-company" value={leadForm.companyName} onChange={(event) => updateLeadField("companyName", event.target.value)} placeholder="Nome da empresa" autoComplete="organization" />
          {leadErrors.companyName && <p className="text-sm font-medium text-destructive">{leadErrors.companyName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="home-lead-whatsapp">WhatsApp</Label>
          <Input id="home-lead-whatsapp" value={leadForm.whatsapp} onChange={(event) => updateLeadField("whatsapp", event.target.value)} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" />
          {leadErrors.whatsapp && <p className="text-sm font-medium text-destructive">{leadErrors.whatsapp}</p>}
        </div>
      </div>

      {leadErrors.form && <p className="mt-4 text-sm font-medium text-destructive">{leadErrors.form}</p>}

      <Button className="mt-6 w-full" variant="warm" size="touch" disabled={isSubmittingLead}>
        {isSubmittingLead ? "Enviando..." : "Testar em um evento"} <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  );
};

const SectionHeader = ({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
}) => (
  <div className={cn("space-y-4", align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl")}>
    {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
    <h2 className="text-3xl font-bold leading-tight sm:text-5xl">{title}</h2>
    {text && <p className="text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{text}</p>}
  </div>
);

const MiniQrCode = () => (
  <div className="grid aspect-square w-28 grid-cols-5 gap-1 rounded-lg border border-border bg-card p-3 shadow-soft">
    {Array.from({ length: 25 }).map((_, index) => {
      const active = [0, 1, 2, 5, 10, 12, 14, 16, 18, 19, 20, 22, 24].includes(index);
      return <span key={index} className={cn("rounded-sm", active ? "bg-surface-strong" : "bg-muted")} />;
    })}
  </div>
);

const NetworkVisual = () => (
  <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-border bg-card p-8 shadow-soft">
    <div className="absolute inset-0 bg-gradient-hero" />
    <div className="absolute left-1/2 top-1/2 h-px w-64 -translate-x-1/2 bg-border" />
    <div className="absolute left-1/2 top-1/2 h-48 w-px -translate-y-1/2 bg-border" />
    <div className="absolute left-[20%] top-[24%] h-px w-[58%] rotate-12 bg-border" />
    <div className="absolute left-[24%] top-[68%] h-px w-[52%] -rotate-12 bg-border" />
    {[
      "left-[48%] top-[45%] h-5 w-5 bg-primary",
      "left-[18%] top-[22%] h-4 w-4 bg-card",
      "left-[73%] top-[26%] h-4 w-4 bg-card",
      "left-[28%] top-[72%] h-4 w-4 bg-card",
      "left-[78%] top-[70%] h-4 w-4 bg-card",
      "left-[12%] top-[55%] h-3 w-3 bg-muted",
      "left-[87%] top-[48%] h-3 w-3 bg-muted",
    ].map((classes) => (
      <span key={classes} className={cn("absolute rounded-full border border-border shadow-soft", classes)} />
    ))}
    <div className="relative z-10 ml-auto max-w-xs rounded-lg border border-border bg-background/90 p-5 shadow-soft backdrop-blur">
      <p className="text-sm font-semibold text-muted-foreground">Depois do evento</p>
      <p className="mt-2 text-2xl font-bold leading-tight">A rede se dispersa se ninguém captura o momento.</p>
    </div>
    <div className="absolute bottom-6 left-6 z-10 rounded-lg border border-border bg-card p-4 text-sm font-bold shadow-soft">
      O evento acaba. A oportunidade não deveria acabar junto.
    </div>
  </div>
);

const HeroMockup = () => (
  <div className="relative mx-auto w-full max-w-xl animate-soft-rise lg:ml-auto">
    <div className="absolute -left-4 top-16 z-10 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-primary shadow-soft">+1 lead</div>
    <div className="absolute -right-2 top-8 z-10 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold shadow-soft">Avaliação positiva</div>
    <div className="absolute -left-2 bottom-12 z-10 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold shadow-soft">Novo orçamento</div>
    <div className="absolute -right-3 bottom-24 z-10 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold shadow-soft">Feedback recebido</div>

    <div className="rounded-lg border border-border bg-card p-3 shadow-soft transition-transform duration-300 hover:-translate-y-1">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Evento de sábado</p>
            <p className="text-lg font-bold">Captura em tempo real</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Ativo
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[9rem_1fr]">
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-4">
            <MiniQrCode />
            <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">QR Code do evento</p>
          </div>
          <div className="space-y-3">
            {liveJourney.map(({ icon: Icon, label, tone }, index) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-soft"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold leading-5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProductRadiation = () => (
  <div className="relative min-h-[27rem] rounded-lg border border-border bg-card p-6 shadow-soft">
    <div className="absolute inset-0 bg-gradient-hero" />
    <div className="relative z-10 flex h-full min-h-[24rem] items-center justify-center">
      <div className="absolute left-1/2 top-1/2 h-px w-[78%] -translate-x-1/2 bg-border" />
      <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 rotate-45 bg-border" />
      <div className="absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 -rotate-45 bg-border" />
      <div className="relative z-10 grid h-36 w-36 place-items-center rounded-lg border border-border bg-background shadow-soft">
        <MiniQrCode />
      </div>
      {productPillars.map(({ icon: Icon, title, text }, index) => {
        const positions = ["left-4 top-8", "right-4 top-8", "bottom-6 left-1/2 -translate-x-1/2"];
        return (
          <div key={title} className={cn("absolute z-20 w-44 rounded-lg border border-border bg-card p-4 shadow-soft", positions[index])}>
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="font-bold leading-6">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{text}</p>
          </div>
        );
      })}
    </div>
  </div>
);

const DashboardMockup = () => (
  <div className="rounded-lg border border-border bg-surface-strong p-2 shadow-soft">
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-col gap-4 border-b border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">QR Code ativo</p>
          <h3 className="text-xl font-bold">Evento de sábado</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-primary">Status: Ativo</span>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold">Exportação CSV</span>
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold">Configurações</span>
        </div>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <p className="text-3xl font-bold leading-none">{value}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Respostas recentes</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {recentResponses.map(([name, action, status]) => (
                <div key={name} className="grid gap-2 rounded-lg bg-muted p-3 text-sm sm:grid-cols-[1fr_1fr_1fr]">
                  <p className="font-semibold">{name}</p>
                  <p className="text-muted-foreground">{action}</p>
                  <p className="font-semibold text-primary">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="font-bold">Intenções capturadas</p>
            </div>
            <div className="space-y-3">
              {[
                ["Orçamentos", "w-4/5"],
                ["Avaliações", "w-3/4"],
                ["Feedbacks", "w-1/3"],
              ].map(([label, width]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>{label}</span>
                    <span>Hoje</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={cn("h-2 rounded-full bg-primary", width)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <p className="font-bold">Alerta WhatsApp</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">12 leads enviados ao telefone configurado pela empresa.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-3" aria-label="Captura Eventos">
            <div className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-primary shadow-soft">
              <QrCode className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
            </div>
            <p className="text-sm font-bold leading-tight">Captura Eventos</p>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Navegação principal">
            {navItems.map((item) => (
              <a key={item.href} className="transition-colors hover:text-foreground" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <Button asChild variant="warm" size="sm">
            <Link to="/solicitar-acesso">Testar em um evento</Link>
          </Button>
        </div>
      </header>

      <section className="relative px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:px-10">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute left-1/2 top-20 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-3xl space-y-8 animate-soft-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" /> Oportunidades invisíveis em cada evento
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-bold leading-[1.04] sm:text-6xl lg:text-7xl">
                Transforme convidados em novos clientes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
                Gere orçamentos e aumente suas avaliações no Google durante os eventos com a nossa plataforma.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="warm" size="touch">
                <Link to="/solicitar-acesso">
                  Quero capturar oportunidades <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="quiet" size="touch">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
          </div>

          <HeroMockup />
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
            <SectionHeader
              title="Cada evento cria uma rede. Poucas empresas capturam essa rede."
              text="Um evento não reúne apenas convidados. Ele reúne futuros clientes, indicadores, famílias, amigos, empresas e pessoas que acabaram de viver a experiência da marca."
            />
            <div className="rounded-lg border border-border bg-card p-6 text-2xl font-bold leading-snug shadow-soft sm:p-8 sm:text-3xl">
              O evento acaba. A oportunidade não deveria acabar junto.
            </div>
          </div>
          <NetworkVisual />
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeader
            eyebrow="Oportunidade perdida"
            title="A oportunidade está ali — mas vai embora sem deixar rastro."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {problemCards.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <div className="mb-6 grid h-11 w-11 place-items-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-brand-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="produto" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
            <SectionHeader
              eyebrow="Produto"
              title="Uma camada simples de captura para cada evento."
              text="A empresa cria um QR Code, coloca no evento e transforma respostas rápidas em contatos, reputação e aprendizado."
            />
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {productPillars.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-soft">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold leading-6">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ProductRadiation />
        </div>
      </section>

      <section id="como-funciona" className="bg-surface px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-12">
          <SectionHeader
            align="center"
            eyebrow="Como funciona"
            title="Como funciona na prática"
            text="Sem aplicativo, sem login para o convidado e sem complicar a operação do evento."
          />
          <div className="grid gap-4 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                {index < steps.length - 1 && <div className="absolute left-10 top-10 hidden h-px w-full bg-border lg:block" />}
                <div className="relative z-10 mb-5 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-primary shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-base font-bold leading-6">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeader
            eyebrow="Valor gerado"
            title="O que antes se perdia, agora vira ativo."
            text="Cada evento pode alimentar três ativos importantes para o negócio."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {capturedAssets.map(({ icon: Icon, title, text, example }) => (
              <div key={title} className="flex min-h-full flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <div>
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-brand-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold leading-7">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
                <div className="mt-8 rounded-lg border border-border bg-muted p-4 text-sm font-semibold leading-6 text-foreground">
                  “{example}”
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="para-quem" className="bg-surface px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeader
            title="Para negócios que vivem de experiência presencial."
            text="A plataforma faz sentido para empresas que recebem pessoas, entregam experiências e dependem de indicação, reputação e novos orçamentos."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                <CircleDot className="mb-5 h-5 w-5 text-primary" />
                <h3 className="font-bold leading-6">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <SectionHeader
            eyebrow="Painel"
            title="Tudo organizado em um painel simples."
            text="A empresa acompanha respostas, pedidos de orçamento, intenção de avaliação no Google e feedbacks em um único lugar."
          />
          <DashboardMockup />
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeader align="center" title="Na prática, isso vira dinheiro, reputação e aprendizado." />
          <div className="grid gap-4 lg:grid-cols-3">
            {scenarios.map((scenario, index) => {
              const icons = [TrendingUp, Star, Zap];
              const Icon = icons[index];
              return (
                <div key={scenario.title} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
                  <div className="mb-6 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold leading-7">{scenario.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{scenario.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="duvidas" className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-lg border border-border bg-surface-strong p-8 text-center text-surface-strong-foreground shadow-soft sm:p-12">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Workflow className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold leading-tight text-surface-strong-foreground sm:text-5xl">
              Seu evento já gera atenção. Agora transforme isso em oportunidade.
            </h2>
            <p className="text-base leading-7 text-surface-strong-foreground/80 sm:text-lg sm:leading-8">
              Capture contatos, avaliações e feedbacks de quem acabou de viver sua experiência.
            </p>
            <div className="pt-2">
              <Button asChild variant="warm" size="touch">
                <Link to="/solicitar-acesso">
                  Quero testar em um evento <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-surface-strong-foreground/70">Acesso liberado manualmente para empresas em teste.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-background text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Captura Eventos</p>
              <p className="text-sm text-muted-foreground">Contatos, reputação e oportunidades em cada evento.</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground" aria-label="Links do rodapé">
            {navItems.slice(0, 4).map((item) => (
              <a key={item.href} className="transition-colors hover:text-foreground" href={item.href}>
                {item.label}
              </a>
            ))}
            <Link className="transition-colors hover:text-foreground" to="/login">Entrar</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
};

export default Index;
