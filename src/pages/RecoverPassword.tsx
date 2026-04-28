import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const recoverSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido").max(255),
});

const RecoverPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = recoverSchema.safeParse({ email });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setLoading(false);

    if (error) {
      toast.error("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }

    setSent(true);
    toast.success("Se o e-mail existir, você receberá instruções para redefinir sua senha.");
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <Button asChild variant="quiet" className="mb-5 w-fit">
          <Link to="/login"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
        </Button>
        <section className="rounded-lg bg-card p-5 shadow-soft sm:p-7">
          <form className="space-y-6" onSubmit={submit} noValidate>
            <div className="space-y-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold leading-tight">Recuperar acesso</h1>
                <p className="mt-2 text-muted-foreground">Digite seu e-mail e enviaremos um link para redefinir sua senha.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" className="h-14 rounded-lg pl-11 text-base" />
              </div>
              {sent && <p className="text-sm text-muted-foreground">Se o e-mail existir, você receberá instruções para redefinir sua senha.</p>}
            </div>
            <Button type="submit" variant="hero" size="touch" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enviar link de recuperação
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default RecoverPassword;