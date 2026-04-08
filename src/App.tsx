import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ComoFunciona from "./pages/ComoFunciona.tsx";
import StudyHub from "./pages/StudyHub.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import Agenda from "./pages/Agenda.tsx";
import SimuladoView from "./pages/SimuladoView.tsx";
import SimuladoFiltros from "./pages/SimuladoFiltros.tsx";
import EstudoManualPage from "./pages/EstudoManualPage.tsx";
import MetricasPage from "./pages/MetricasPage.tsx";
import EmbedDashboardPage from "./pages/EmbedDashboardPage.tsx";
import EmbedAgendaPage from "./pages/EmbedAgendaPage.tsx";
import EmbedSimuladoFiltrosPage from "./pages/EmbedSimuladoFiltrosPage.tsx";
import AppLayout from "./components/AppLayout.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* No sidebar */}
          <Route path="/" element={<Index />} />
          <Route path="/simulado" element={<SimuladoView />} />
          <Route path="/dashboard/estudo-manual" element={<EstudoManualPage />} />
          <Route path="/embed/dashboard" element={<EmbedDashboardPage />} />
          <Route path="/embed/agenda" element={<EmbedAgendaPage />} />
          <Route path="/embed/simulado-filtros" element={<EmbedSimuladoFiltrosPage />} />

          {/* With Navigation Rail */}
          <Route element={<AppLayout />}>
            <Route path="/hub" element={<StudyHub />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/simulado-filtros" element={<SimuladoFiltros />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/metricas" element={<MetricasPage />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
