import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginScreen from "@/components/LoginScreen";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auto-login via URL param (iframe-friendly)
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      localStorage.setItem("userEmail", emailFromUrl);
      navigate("/hub", { replace: true });
      return;
    }

    const stored = localStorage.getItem("userEmail");
    if (stored) {
      navigate("/hub", { replace: true });
    } else {
      setReady(true);
    }
  }, [navigate, searchParams]);

  const handleLogin = (userEmail: string) => {
    localStorage.setItem("userEmail", userEmail);
    navigate("/hub");
  };

  if (!ready) return null;

  return <LoginScreen onLogin={handleLogin} />;
};

export default Index;
