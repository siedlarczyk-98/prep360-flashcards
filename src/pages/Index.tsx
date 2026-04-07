import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { identificarUsuario } from "@/lib/api";
import { getTokenInfo } from "@/lib/legacy";
import LoginScreen from "@/components/LoginScreen";
import { TokenInfoResponse } from "@/types/legacy";

const Index = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");

    const token = localStorage.getItem("userToken");
    if (token) {
      navigate("/hub", { replace: true });
      return;
    }

    if (accessToken) {
      const handleAccessToken = async () => {
        try {
          setLoading(true);

          localStorage.setItem("userToken", accessToken);

          const data: TokenInfoResponse = await getTokenInfo(accessToken);


          await handleLogin(data.user.email, data.userId);

          const url = new URL(window.location.href);
          url.searchParams.delete("accessToken");
          window.history.replaceState({}, document.title, url.toString());

          navigate("/hub", { replace: true });
        } catch (err) {
          console.error("Erro ao processar accessToken:", err);
          localStorage.removeItem("userToken");
          setReady(true);
        } finally {
          setLoading(false);
        }
      };

      handleAccessToken();
      return;
    }

    setReady(true);
  }, [navigate]);

  const handleLogin = async (email: string, userId?: number) => {
    setLoading(true);
    setError("");
    try {
      const { token } = await identificarUsuario(email, userId);

      localStorage.setItem("userToken", token);
      localStorage.setItem("userEmail", email);
      if (userId !== undefined) {
        localStorage.setItem("userId", userId.toString());
      }

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