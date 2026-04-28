import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres").max(72),
    confirmPassword: z.string().min(1, "Confirme sua nova senha"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas precisam ser iguais",
    path: ["confirmPassword"],
  });

const NewPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCheckingSession(false);
      if (!data.session) {
        toast.error("Link de recuperação inválido ou expirado.");
        navigate("/recuperar-senha", { replace: true });
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = passwordSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira a nova senha.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (!error) {
      await supabase.auth.signOut();
    }
    setLoading(false);

    if (error) {
      toast.error("Não foi possível redefinir sua senha. Tente novamente.");
      return;
    }

    toast.success("Senha redefinida com sucesso");
    navigate("/login", { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-8">
      <section className="w-full max-w-md rounded-lg bg-card p-5 shadow-soft sm:p-7">
        <form className="space-y-6" onSubmit={submit} noValidate>
          <div className="space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">Nova senha</h1>
              <p className="mt-2 text-muted-foreground">Crie uma nova senha para acessar sua conta.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Nova senha" autoComplete="new-password" className="h-14 rounded-lg text-base" disabled={checkingSession} />
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Confirmar senha" autoComplete="new-password" className="h-14 rounded-lg text-base" disabled={checkingSession} />
          </div>
          <Button type="submit" variant="hero" size="touch" className="w-full" disabled={loading || checkingSession}>
            {(loading || checkingSession) && <Loader2 className="h-4 w-4 animate-spin" />} Redefinir senha
          </Button>
        </form>
      </section>
    </main>
  );
};

export default NewPassword;