import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { identificarUsuario } from "@/lib/api";
import LoginScreen from "@/components/LoginScreen";

const Index = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auto-login: token já existe
    const token = localStorage.getItem("userToken");
    if (token) {
      navigate("/hub", { replace: true });
      return;
    }

    setReady(true);
  }, []);

  const handleLogin = async (email: string) => {
    setLoading(true);
    setError("");
    try {
      const { token } = await identificarUsuario(email);
      localStorage.setItem("userToken", token);
      localStorage.setItem("userEmail", email);
      navigate("/hub", { replace: true });
    } catch {
      setError("Não foi possível autenticar. Verifique seu e-mail.");
      setLoading(false);
    }
  };

  if (!ready && !loading) return null;

  return <LoginScreen onLogin={handleLogin} loading={loading} error={error} />;
};

export default Index;
