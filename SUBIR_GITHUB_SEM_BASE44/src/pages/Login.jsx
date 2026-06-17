import React from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  return (
    <AuthLayout
      icon={LogIn}
      title="Login desativado"
      subtitle="Este app agora funciona fora da Base44"
    >
      <p className="text-sm text-muted-foreground text-center mb-6">
        Nao e necessario entrar com Google ou senha. Comece pelo cadastro do teste.
      </p>
      <Link to="/register">
        <Button className="w-full h-12 font-medium">Iniciar teste</Button>
      </Link>
    </AuthLayout>
  );
}
