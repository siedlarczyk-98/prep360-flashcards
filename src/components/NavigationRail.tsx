import { useLocation, useNavigate } from "react-router-dom";
import { Home, Brain, Calendar, Target, BarChart3, Menu, HelpCircle, MessageCircle, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import logoHeader from "@/assets/logo-header.png";

const NAV_ITEMS = [
  { path: "/hub", label: "Início", icon: Home },
  { path: "/dashboard", label: "Flashcards", icon: Brain },
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/simulado-filtros", label: "Questões", icon: Target },
  { path: "/dashboard/metricas", label: "Métricas", icon: BarChart3 },
];

const PAGE_TITLES: Record<string, string> = {
  "/hub": "Início",
  "/dashboard": "Flashcards",
  "/agenda": "Agenda de Estudos",
  "/simulado-filtros": "Treino com Questões",
  "/dashboard/metricas": "Métricas",
  "/como-funciona": "Como Funciona",
};

const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=551126266561&text&type=phone_number&app_absent=0";

const NavigationRail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || "";

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/", { replace: true });
    setOpen(false);
  };

  return (
    <header className="h-auto min-h-[44px] bg-primary flex items-center px-3 gap-2.5 shrink-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="text-primary-foreground/80 hover:text-primary-foreground p-1 rounded-md hover:bg-[hsl(var(--sidebar-accent))] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 bg-primary border-none p-0 flex flex-col">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>

          {/* Branding logo */}
          <div className="flex items-center justify-center pt-8 pb-6 px-5">
            <img src={logoHeader} alt="Paciente 360" className="h-8 w-auto object-contain" />
          </div>

          {/* Separator */}
          <div className="mx-5 mb-3 border-t border-primary-foreground/10" />

          <nav className="flex flex-col flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-[hsl(var(--sidebar-accent))]"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Separator */}
            <div className="mx-5 my-2 border-t border-primary-foreground/10" />

            {/* Como Funciona */}
            <button
              onClick={() => { navigate("/como-funciona"); setOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all ${
                location.pathname === "/como-funciona"
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-[hsl(var(--sidebar-accent))]"
              }`}
            >
              <HelpCircle className="w-4.5 h-4.5" />
              <span>Como Funciona</span>
            </button>

            {/* Suporte WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-[hsl(var(--sidebar-accent))] transition-all"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Suporte</span>
            </a>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer: Logout */}
            <div className="mx-5 border-t border-primary-foreground/10" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary-foreground/50 hover:text-primary-foreground hover:bg-[hsl(var(--sidebar-accent))] transition-all"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Trocar e-mail / Sair</span>
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <img src={logoHeader} alt="Logo" className="h-5 w-auto object-contain" />

      {/* Page title */}
      <span className="text-primary-foreground/90 text-xs font-semibold tracking-tight">
        {pageTitle}
      </span>

      {/* Spacer */}
      <div className="flex-1" />
    </header>
  );
};

export default NavigationRail;
