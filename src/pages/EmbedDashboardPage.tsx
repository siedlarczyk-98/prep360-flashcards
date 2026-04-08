import Dashboard from "@/components/Dashboard";

const EmbedDashboardPage = () => {
  const email = localStorage.getItem("userEmail") || "embed@user.com";

  return (
    <div className="h-screen w-full overflow-y-auto bg-transparent">
      <Dashboard email={email} onLogout={() => {}} />
    </div>
  );
};

export default EmbedDashboardPage;
