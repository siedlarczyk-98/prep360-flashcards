import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logoIsotipo from "@/assets/logo-isotipo.png";

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) onLogin(email.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-circles-pattern p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-[1]">
        
        <div className="text-center mb-8">
          <img src={logoIsotipo} alt="Enamed360" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Trilha ENAMED</h1>
          <p className="text-muted-foreground mt-2 font-light">Onde aprendizado e preparação se encontram     </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Seu e-mail cadastrado no Paciente 360   
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base rounded-lg"
              required />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg" style={{ boxShadow: "var(--shadow-elevated)" }}>
            Acessar conteúdos
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>);

};

export default LoginScreen;