import React from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  return (
    <AuthLayout
      icon={Mail}
      title="Senha desativada"
      subtitle="Nao usamos mais login da Base44"
    >
      <p className="text-sm text-muted-foreground text-center mb-6">
        Este app nao precisa de recuperacao de senha. Os resultados ficam no navegador em que o teste foi feito.
      </p>
      <Link to="/register">
        <Button className="w-full h-12 font-medium">Iniciar novo teste</Button>
      </Link>
    </AuthLayout>
  );
}
