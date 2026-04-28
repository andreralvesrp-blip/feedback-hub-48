import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Heart, HeartHandshake, Loader2, MessageSquareText, PartyPopper, Sparkles, ThumbsUp } from "lucide-react";
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
  whatsapp: z.string().trim().regex(/^\(\d{2}\) \d \d{4}-\d{4}$/, "Informe um WhatsApp válido com DDD"),
});

const privateContactSchema = z.object({
  name: z.string().trim().max(120),
  whatsapp: z.string().trim().refine((value) => !value || /^\(\d{2}\) \d \d{4}-\d{4}$/.test(value), "Informe um WhatsApp válido com DDD"),
});

const sanitizePhone = (value: string) => value.replace(/\D/g, "");

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const area = digits.slice(0, 2);
  const mobileDigit = digits.slice(2, 3);
  const first = digits.slice(3, 7);
  const second = digits.slice(7, 11);

  if (digits.length <= 2) return area ? `(${area}` : "";
  if (digits.length <= 3) return `(${area}) ${mobileDigit}`;
  if (!second) return `(${area}) ${mobileDigit} ${first}`;
  return `(${area}) ${mobileDigit} ${first}-${second}`;
};

type ExperienceRating = "loved" | "ok" | "improve";

const experienceLabel: Record<ExperienceRating, string> = {
  loved: "Adorei",
  ok: "Foi ok",
  improve: "Pode melhorar",
};

const reactionOptions = [
  { label: experienceLabel.loved, Icon: Heart, value: "loved" as const, className: "reaction-loved" },
  { label: experienceLabel.ok, Icon: ThumbsUp, value: "ok" as const, className: "reaction-ok" },
  { label: experienceLabel.improve, Icon: Sparkles, value: "improve" as const, className: "reaction-improve" },
];

const PublicReview = () => {
  const { slug = "" } = useParams();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [experienceRating, setExperienceRating] = useState<ExperienceRating | null>(null);
  const [step, setStep] = useState<"experience" | "private" | "contact" | "thanks" | "google" | "budget" | "contactSaved" | "done">("experience");
  const [responseId, setResponseId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [wantsGoogle, setWantsGoogle] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const experienceAdvanceTimer = useRef<number | null>(null);

  const isLoved = experienceRating === "loved";
  const flowOrder = isLoved ? ["experience", "thanks", "budget", "contactSaved", "google", "done"] : ["experience", "private", "contact", "done"];
  const currentStepIndex = Math.max(0, flowOrder.indexOf(step));
  const progress = useMemo(() => {
    return Math.max(18, ((currentStepIndex + 1) / flowOrder.length) * 100);
  }, [isLoved, step]);

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

  const submitExperience = async (options?: { redirected?: boolean; google?: boolean }) => {
    if (!experienceRating) return null;
    setSubmitting(true);
    const { data, error } = await (supabase as any).rpc("submit_experience_response", {
      _company_slug: slug,
      _experience_rating: experienceRating,
      _comment: comment,
      _name: name.trim(),
      _whatsapp: sanitizePhone(whatsapp),
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

  const handleExperience = (value: ExperienceRating) => {
    if (experienceAdvanceTimer.current) window.clearTimeout(experienceAdvanceTimer.current);
    setExperienceRating(value);
    setWantsGoogle(value === "loved");
    experienceAdvanceTimer.current = window.setTimeout(() => {
      setStep(value === "loved" ? "thanks" : "private");
    }, 180);
  };

  const handlePrivateSubmit = async () => {
    const parsed = privateContactSchema.safeParse({ name, whatsapp });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira seus dados.");
      return;
    }
    const id = await submitExperience();
    if (id) setStep("done");
  };

  const handleGoogleContinue = async () => {
    const experienceId = responseId ?? (await submitExperience({ google: true, redirected: false }));
    if (!experienceId) return;
    if (company?.google_reviews_url) {
      setSubmitting(true);
      const { error } = await (supabase as any).rpc("mark_experience_google_review_intent", { _response_id: experienceId });
      setSubmitting(false);
      if (error) {
        toast.error(error.message || "Não foi possível registrar sua escolha.");
        return;
      }
      window.open(company.google_reviews_url, "_blank", "noopener,noreferrer");
    }
    setStep("done");
  };

  const handleFinalGoogleReview = async () => {
    if (!responseId || !company?.google_reviews_url) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("mark_experience_google_review_intent", { _response_id: responseId });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não foi possível registrar sua escolha.");
      return;
    }
    window.open(company.google_reviews_url, "_blank", "noopener,noreferrer");
  };

  const submitBudget = async () => {
    const parsed = contactSchema.safeParse({ name, whatsapp });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira seus dados.");
      return;
    }
    const experienceId = responseId ?? (await submitExperience({ google: false, redirected: false }));
    if (!experienceId) return;
    setSubmitting(true);
    const { error } = await (supabase as any).rpc("submit_budget_request", {
      _company_slug: slug,
      _name: parsed.data.name,
      _whatsapp: sanitizePhone(parsed.data.whatsapp),
      _interest: "outro",
      _experience_rating: experienceRating,
      _experience_response_id: experienceId,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar o pedido.");
      return;
    }
    setContactSaved(true);
    setStep("contactSaved");
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

        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs font-black text-muted-foreground">
            {flowOrder.slice(0, -1).map((item, index) => (
              <span key={item} className={index <= currentStepIndex ? "text-primary" : undefined}>
                {index + 1}
              </span>
            ))}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <section className="flex flex-1 flex-col justify-center rounded-3xl bg-card p-5 shadow-soft animate-soft-rise">
          {step === "experience" && (
            <div className="mx-auto w-full max-w-sm space-y-8 py-4 text-center">
              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight">Como foi sua experiência hoje no Kids Point?</h1>
              </div>
              <div className="space-y-3">
                {reactionOptions.map((option) => {
                  const Icon = option.Icon;
                  const selected = experienceRating === option.value;
                  return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleExperience(option.value)}
                    className={`reaction-choice ${option.className} ${selected ? "reaction-choice-selected" : ""}`}
                  >
                    <Icon className="reaction-icon h-6 w-6" strokeWidth={2.4} fill="currentColor" aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                  );
                })}
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
              <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} inputMode="tel" maxLength={16} placeholder="WhatsApp (opcional)" className="h-14 rounded-2xl text-base" />
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
              <Button variant="hero" size="touch" className="w-full" onClick={() => setStep("budget")}>Continuar</Button>
            </div>
          )}

          {step === "google" && (
            <div className="space-y-5 text-center">
              <ExternalLink className="h-10 w-10 text-primary" />
              <h1 className="text-2xl font-black leading-tight">Quer nos ajudar e compartilhar sua avaliação no Google?</h1>
              <p className="text-sm font-bold text-muted-foreground">Leva menos de 1 minuto.</p>
              <p className="text-sm text-muted-foreground">Sua avaliação ajuda outras pessoas a escolherem com mais confiança.</p>
              <Button variant="hero" size="touch" className="w-full" onClick={handleGoogleContinue} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Avaliar no Google
              </Button>
              <Button variant="quiet" size="touch" className="w-full" onClick={() => { setWantsGoogle(false); setStep("done"); }} disabled={submitting}>
                Agora não
              </Button>
            </div>
          )}

          {step === "contactSaved" && (
            <div className="space-y-5 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h1 className="text-2xl font-black leading-tight">Perfeito! Já recebemos seu contato 😊</h1>
              <p className="text-base text-muted-foreground">Iremos te chamar pelo WhatsApp em breve</p>
              <Button variant="hero" size="touch" className="w-full" onClick={() => setStep("google")}>
                Continuar
              </Button>
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-5">
              <p className="font-bold text-primary">Se você também estiver planejando um evento, podemos te ajudar 😊</p>
              <h1 className="text-2xl font-black leading-tight">Quer receber nosso contato?</h1>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="h-14 rounded-2xl text-base" />
              <Input value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} inputMode="tel" maxLength={16} placeholder="WhatsApp com DDD" className="h-14 rounded-2xl text-base" />
              <Button variant="warm" size="touch" className="w-full rounded-2xl shadow-none" onClick={submitBudget} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Receber contato
              </Button>
              <Button variant="quiet" size="touch" className="w-full rounded-2xl shadow-none" onClick={() => setStep("google")} disabled={submitting}>
                Não tenho interesse
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
              <h1 className="text-3xl font-black leading-tight">{isLoved ? "Muito obrigado pela sua avaliação!" : "Obrigado pelo feedback. Sua opinião ajuda a empresa a melhorar."}</h1>
              {!isLoved && company.google_reviews_url && (
                <div className="space-y-4 text-left">
                  <label className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm">
                    <Checkbox checked={wantsGoogle} onCheckedChange={(v) => setWantsGoogle(Boolean(v))} />
                    <span>Deixar minha avaliação no Google</span>
                  </label>
                  {wantsGoogle && (
                    <Button variant="hero" size="touch" className="w-full" onClick={handleFinalGoogleReview} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Continuar para o Google
                    </Button>
                  )}
                </div>
              )}
              {isLoved && wantsGoogle && company.google_reviews_url && (
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
