import { useEffect, useState } from "react";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const authSchema = z.object({
  email: z.string().trim().email("Informe um email válido").max(255),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres").max(72),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/app", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/app", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const submit = async () => {
    const parsed = authSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Confira os dados.");
      return;
    }
    const credentials = { email: parsed.data.email, password: parsed.data.password };
    setLoading(true);
    const result = await supabase.auth.signInWithPassword(credentials);
    setLoading(false);
    if (result.error) {
      toast.error("Acesso ainda não liberado. Aguarde aprovação.");
      return;
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-8">
      <section className="w-full max-w-md rounded-lg bg-card p-5 shadow-soft animate-soft-rise">
        <div className="mb-7 space-y-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Área do cliente</h1>
            <p className="text-muted-foreground">Entre para ver experiência, orçamentos, QR Code e configurações.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid gap-3">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-14 rounded-lg pl-11 text-base" />
            </div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Senha" className="h-14 rounded-lg text-base" />
          </div>
          <Button variant="hero" size="touch" className="w-full" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
          </Button>
          <button className="w-full rounded-lg py-3 text-sm font-semibold text-primary" onClick={() => navigate("/solicitar-acesso")}>
            Ainda não tenho conta
          </button>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
