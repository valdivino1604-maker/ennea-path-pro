import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  return (
    <AuthLayout
      icon={Lock}
      title="Redefinicao desativada"
      subtitle="Nao ha login externo neste app"
    >
      <p className="text-sm text-muted-foreground text-center mb-6">
        A redefinicao de senha era da Base44. Agora o teste roda direto no Cloudflare.
      </p>
      <Link to="/register">
        <Button className="w-full h-12 font-medium">Ir para o cadastro</Button>
      </Link>
    </AuthLayout>
  );
}
