import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, HeartHandshake, Loader2, MessageSquareText, PartyPopper } from "lucide-react";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PublicCompany = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  segment: string | null;
  whatsapp: string | null;
  google_reviews_url: string | null;
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  whatsapp: z.string().trim().regex(/^[0-9+()\-\s]{8,32}$/, "Informe um WhatsApp válido"),
});

const sanitizePhone = (value: string) => value.replace(/[^0-9+]/g, "");

const PublicReview = () => {
  const { slug = "" } = useParams();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [step, setStep] = useState<"nps" | "private" | "contact" | "thanks" | "google" | "budget" | "done">("nps");
  const [responseId, setResponseId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [wantsGoogle, setWantsGoogle] = useState(false);

  const isHappy = score !== null && score >= 9;
  const progress = useMemo(() => {
    const order = isHappy ? ["nps", "thanks", "google", "budget", "done"] : ["nps", "private", "contact", "done"];
    return Math.max(18, ((order.indexOf(step) + 1) / order.length) * 100);
  }, [isHappy, step]);

  useEffect(() => {
    let active = true;
    const loadCompany = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any).rpc("get_public_company", { _slug: slug });
      if (!active) return;
      if (error) toast.error("Não foi possível carregar esta empresa.");
      setCompany(data?.[0] ?? null);
      setLoading(false);
    };
    loadCompany();
    return () => {
      active = false;
    };
  }, [slug]);

  const submitNps = async (options?: { redirected?: boolean; google?: boolean }) => {
    if (score === null) return null;
    setSubmitting(true);
    const { data, error } = await (supabase as any).rpc("submit_nps_response", {
      _company_slug: slug,
      _score: score,
      _comment: comment,
      _name: name,
      _whatsapp: whatsapp,
      _wants_google_review: options?.google ?? wantsGoogle,
      _redirected_to_google: options?.redirected ?? false,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar sua resposta.");
      return null;
    }
    setResponseId(data);
    return data as string;
  };

  const handleScore = (value: number) => {
    setScore(value);
    if (value <= 8) {
      setWantsGoogle(false);
      setStep("private");
    } else {
      setWantsGoogle(true);
      setStep("thanks");
    }
  };

  const handlePrivateSubmit = async () => {
    const id = await submitNps();
    if (id) setStep("done");
  };

  const handleGoogleContinue = async () => {
    const id = await submitNps({ google: wantsGoogle, redirected: wantsGoogle });
    if (!id) return;
    if (wantsGoogle && company?.google_reviews_url) {
      window.open(company.google_reviews_url, "_blank", "noopener,noreferrer");
    }
    setStep("budget");
  };

  const submitBudget = async () => {
    const parsed = contactSchema.safeParse({ name, whatsapp });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira seus dados.");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("submit_budget_request", {
      _company_slug: slug,
      _name: parsed.data.name,
      _whatsapp: sanitizePhone(parsed.data.whatsapp),
      _interest: "outro",
      _nps_score: score,
      _nps_response_id: responseId,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar o pedido.");
      return;
    }
    setStep("done");
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (!company) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-center">
        <div className="max-w-sm space-y-3 rounded-3xl bg-card p-6 shadow-soft">
          <h1 className="text-2xl font-black">Link não encontrado</h1>
          <p className="text-muted-foreground">Confira se o endereço da empresa está correto.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 tap-highlight-none">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md flex-col">
        <header className="mb-5 flex items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={`Logo ${company.name}`} className="h-12 w-12 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground font-black">
              {company.name.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-black leading-tight">{company.name}</p>
            <p className="text-sm text-muted-foreground">Resposta rápida e segura</p>
          </div>
        </header>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <section className="flex flex-1 flex-col justify-center rounded-3xl bg-card p-5 shadow-soft animate-soft-rise">
          {step === "nps" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-black leading-tight">De 0 a 10, o quanto você recomendaria o {company.name} para um familiar ou amigo?</h1>
              </div>
              <div className="grid grid-cols-11 gap-1.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleScore(i)}
                    className="aspect-square min-w-0 rounded-lg border border-border bg-surface text-sm font-black text-muted-foreground shadow-soft transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
                  >
                    {i}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground sm:text-sm">
                <span>Pouco provável</span>
                <span>Muito provável</span>
              </div>
            </div>
          )}

          {step === "private" && (
            <div className="space-y-5">
              <MessageSquareText className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-black leading-tight">Obrigado pela sinceridade. O que mais te incomodou e/ou poderia ter sido melhor?</h1>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1200} rows={5} placeholder="Queremos te ouvir. Escreva aqui sua sugestão." className="min-h-32 rounded-2xl text-base" />
              <p className="text-sm text-muted-foreground">Fique tranquilo(a). Essa resposta será enviada de forma privada para o dono da empresa como sugestão de melhoria.</p>
              <Button variant="hero" size="touch" className="w-full" onClick={() => setStep("contact")}>Continuar</Button>
            </div>
          )}

          {step === "contact" && (
            <div className="space-y-5">
              <HeartHandshake className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-black leading-tight">Se preferir, podemos te chamar no WhatsApp para entender melhor sua experiência.</h1>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome (opcional)" className="h-14 rounded-2xl text-base" />
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (opcional)" className="h-14 rounded-2xl text-base" />
              <label className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
                <Checkbox checked={wantsGoogle} onCheckedChange={(v) => setWantsGoogle(Boolean(v))} />
                <span>Deixar minha avaliação no Google</span>
              </label>
              <Button variant="hero" size="touch" className="w-full" onClick={handlePrivateSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Enviar feedback
              </Button>
            </div>
          )}

          {step === "thanks" && (
            <div className="space-y-5 text-center">
              <PartyPopper className="mx-auto h-14 w-14 text-accent" />
              <h1 className="text-2xl font-black leading-tight">Ficamos muito felizes que você tenha gostado! 😊</h1>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1200} rows={4} placeholder="O que mais você gostou?" className="min-h-28 rounded-2xl text-left text-base" />
              <Button variant="hero" size="touch" className="w-full" onClick={() => setStep("google")}>Continuar</Button>
            </div>
          )}

          {step === "google" && (
            <div className="space-y-5">
              <ExternalLink className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-black leading-tight">Quer nos ajudar e compartilhar na nossa página do Google?</h1>
              <label className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
                <Checkbox checked={wantsGoogle} onCheckedChange={(v) => setWantsGoogle(Boolean(v))} />
                <span>Leva menos de 1 minuto.</span>
              </label>
              <p className="text-sm text-muted-foreground">Sua avaliação ajuda outras pessoas a escolherem nossa empresa com mais confiança.</p>
              <Button variant="hero" size="touch" className="w-full" onClick={handleGoogleContinue} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Continuar
              </Button>
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-5">
              <p className="font-bold text-primary">Se você também estiver planejando um evento, podemos te ajudar 😊</p>
              <h1 className="text-2xl font-black leading-tight">Quer receber nosso contato?</h1>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="h-14 rounded-2xl text-base" />
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="h-14 rounded-2xl text-base" />
              <Button variant="warm" size="touch" className="w-full" onClick={submitBudget} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Receber contato
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
              <h1 className="text-3xl font-black leading-tight">{isHappy ? "Pronto! A empresa recebeu seu pedido e poderá entrar em contato pelo WhatsApp." : "Obrigado pelo feedback. Sua opinião ajuda a empresa a melhorar."}</h1>
              {!isHappy && wantsGoogle && company.google_reviews_url && (
                <Button asChild variant="hero" size="touch" className="w-full">
                  <a href={company.google_reviews_url} target="_blank" rel="noreferrer">Avaliar no Google</a>
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PublicReview;
