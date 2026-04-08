import MetricasPage from "@/pages/MetricasPage";
import { EmbedProvider } from "@/hooks/useEmbedNavigate";

const EmbedMetricasPage = () => {
  return (
    <EmbedProvider>
      <div className="h-screen w-full overflow-y-auto bg-transparent">
        <MetricasPage />
      </div>
    </EmbedProvider>
  );
};

export default EmbedMetricasPage;
