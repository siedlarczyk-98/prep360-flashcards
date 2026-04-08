import { useEffect, useState } from "react";
import { useEmbedNavigate } from "@/hooks/useEmbedNavigate";
import Dashboard from "@/components/Dashboard";

const DashboardPage = () => {
  const navigate = useEmbedNavigate();
  const email = localStorage.getItem("userEmail") || "";

  useEffect(() => {
    if (!email) navigate("/", { replace: true });
  }, [email, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/", { replace: true });
  };

  if (!email) return null;

  return <Dashboard email={email} onLogout={handleLogout} />;
};

export default DashboardPage;
