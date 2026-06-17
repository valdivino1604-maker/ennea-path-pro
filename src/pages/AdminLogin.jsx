import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("valdivino1604@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
      return;
    }

    fetch("/api/admin/setup-status")
      .then((response) => response.json())
      .then((data) => setNeedsSetup(Boolean(data.needs_setup)))
      .catch(() => {});
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err.message || "E-mail ou senha invalidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Lock}
      title="Acesso master"
      subtitle="Entre para ver os cadastros e resultados"
    >
      {needsSetup && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 text-primary text-sm">
          O master ainda nao foi criado.{" "}
          <Link to="/admin/setup" className="font-semibold underline">Criar agora</Link>
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
