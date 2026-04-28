import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AccessForm = {
  fullName: string;
  companyName: string;
  document: string;
  whatsapp: string;
  email: string;
};

type AccessFormErrors = Partial<Record<keyof AccessForm, string>>;

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

const maskCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
};

const maskWhatsapp = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\) \d{5})(\d)/, "$1-$2");
};

const hasRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value);

const isValidCpf = (value: string) => {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || hasRepeatedDigits(cpf)) return false;

  const digits = cpf.split("").map(Number);
  const firstSum = digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0);
  const firstCheck = firstSum % 11 < 2 ? 0 : 11 - (firstSum % 11);
  const secondSum = digits.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0);
  const secondCheck = secondSum % 11 < 2 ? 0 : 11 - (secondSum % 11);

  return digits[9] === firstCheck && digits[10] === secondCheck;
};

const isValidCnpj = (value: string) => {
  const cnpj = onlyDigits(value);
  if (!/^\d{14}$/.test(cnpj) || hasRepeatedDigits(cnpj)) return false;

  const digits = cnpj.split("").map(Number);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const firstSum = firstWeights.reduce((sum, weight, index) => sum + digits[index] * weight, 0);
  const firstCheck = firstSum % 11 < 2 ? 0 : 11 - (firstSum % 11);
  const secondSum = secondWeights.reduce((sum, weight, index) => sum + digits[index] * weight, 0);
  const secondCheck = secondSum % 11 < 2 ? 0 : 11 - (secondSum % 11);

  return digits[12] === firstCheck && digits[13] === secondCheck;
};

const isValidDocument = (value: string) => {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false;
};

const isValidWhatsapp = (value: string) => {
  const phone = onlyDigits(value);
  const ddd = Number(phone.slice(0, 2));
  const lastEight = phone.slice(3);
  const lastNine = phone.slice(2);

  return (
    /^\d{11}$/.test(phone) &&
    ddd >= 11 &&
    ddd <= 99 &&
    phone[2] === "9" &&
    !hasRepeatedDigits(phone) &&
    !hasRepeatedDigits(lastEight) &&
    !hasRepeatedDigits(lastNine)
  );
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim().toLowerCase());

const validateRequest = (values: AccessForm): { errors: AccessFormErrors; payload: AccessForm } => {
  const payload = {
    fullName: normalizeSpaces(values.fullName),
    companyName: values.companyName.trim(),
    document: onlyDigits(values.document),
    whatsapp: onlyDigits(values.whatsapp),
    email: values.email.trim().toLowerCase(),
  };
  const errors: AccessFormErrors = {};
  const nameParts = payload.fullName.split(" ").filter(Boolean);

  if (
    nameParts.length < 2 ||
    !nameParts.every((part) => part.length >= 2 && /^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(part))
  ) {
    errors.fullName = "Informe nome e sobrenome.";
  }

  if (payload.companyName.length < 3) {
    errors.companyName = "Informe o nome da empresa.";
  }

  if (!isValidDocument(payload.document)) {
    errors.document = "Informe um CPF ou CNPJ válido.";
  }

  if (!isValidWhatsapp(payload.whatsapp)) {
    errors.whatsapp = "Informe um WhatsApp válido.";
  }

  if (!isValidEmail(payload.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  return { errors, payload };
};

const RequestAccess = () => {
  const [form, setForm] = useState({ fullName: "", companyName: "", document: "", whatsapp: "", email: "" });
  const [errors, setErrors] = useState<AccessFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const visibleErrors = useMemo(() => (submitted ? errors : {}), [errors, submitted]);

  const updateField = (field: keyof AccessForm, value: string) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    if (submitted) {
      setErrors(validateRequest(nextForm).errors);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const validation = validateRequest(form);
    setErrors(validation.errors);

    if (Object.keys(validation.errors).length > 0) {
      toast.error("Confira os campos destacados.");
      return;
    }

    setLoading(true);
    const { error } = await (supabase as any).rpc("submit_access_request", {
      _full_name: validation.payload.fullName,
      _company_name: validation.payload.companyName,
      _document: validation.payload.document,
      _whatsapp: validation.payload.whatsapp,
      _email: validation.payload.email,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Não foi possível enviar sua solicitação.");
      return;
    }
    setSent(true);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col justify-center">
        <Button asChild variant="quiet" className="mb-5 w-fit">
          <Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
        <section className="rounded-lg bg-card p-5 shadow-soft sm:p-7">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-brand-soft text-primary">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold leading-tight">Solicitação recebida</h1>
                <p className="text-muted-foreground">Recebemos sua solicitação. Em breve você receberá os dados de acesso à plataforma.</p>
              </div>
              <Button asChild variant="hero" size="touch" className="w-full">
                <Link to="/login">Ir para login</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold leading-tight">Solicitar acesso à plataforma</h1>
                  <p className="mt-2 text-muted-foreground">Preencha os dados abaixo para solicitar acesso. Nossa equipe irá liberar sua conta.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <Input value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Nome e sobrenome" className="h-12 rounded-lg" />
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} placeholder="Nome da empresa" className="h-12 rounded-lg pl-11" />
                </div>
                <Input value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} placeholder="CNPJ ou CPF" className="h-12 rounded-lg" />
                <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="WhatsApp" className="h-12 rounded-lg" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" className="h-12 rounded-lg pl-11" />
                </div>
              </div>
              <Button variant="hero" size="touch" className="w-full" onClick={submit} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Solicitar acesso
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default RequestAccess;