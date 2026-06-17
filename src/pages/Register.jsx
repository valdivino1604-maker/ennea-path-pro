import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Building2, Briefcase, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", company: "", role: "", birth_date: "", gender: "", plan: "basico"
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Nome é obrigatório";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "E-mail inválido";
    if (!form.phone.trim()) e.phone = "Telefone é obrigatório";
    if (!form.birth_date) e.birth_date = "Data de nascimento é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const participant = await base44.entities.TestParticipant.create(form);
      navigate(`/test/${participant.id}`);
    } catch (err) {
      setErrors({ general: "Erro ao cadastrar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.08),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Seus Dados</h1>
            <p className="mt-2 text-sm text-muted-foreground">Preencha seus dados antes de iniciar o teste.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Nome Completo *</Label>
              <Input placeholder="Seu nome completo" value={form.full_name} onChange={e => update("full_name", e.target.value)} className="h-11 bg-background" />
              {errors.full_name && <p className="text-[11px] text-destructive mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">E-mail *</Label>
              <Input type="email" placeholder="seu@email.com" value={form.email} onChange={e => update("email", e.target.value)} className="h-11 bg-background" />
              {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Telefone *</Label>
              <Input placeholder="(11) 99999-9999" value={form.phone} onChange={e => update("phone", e.target.value)} className="h-11 bg-background" />
              {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Empresa</Label>
                <Input placeholder="Empresa" value={form.company} onChange={e => update("company", e.target.value)} className="h-11 bg-background" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Cargo</Label>
                <Input placeholder="Cargo" value={form.role} onChange={e => update("role", e.target.value)} className="h-11 bg-background" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Data de Nascimento *</Label>
              <Input type="date" value={form.birth_date} onChange={e => update("birth_date", e.target.value)} className="h-11 bg-background" />
              {errors.birth_date && <p className="text-[11px] text-destructive mt-1">{errors.birth_date}</p>}
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Sexo</Label>
              <Select value={form.gender} onValueChange={v => update("gender", v)}>
                <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                  <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block text-muted-foreground">Plano</Label>
              <Select value={form.plan} onValueChange={v => update("plan", v)}>
                <SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico (Grátis)</SelectItem>
                  <SelectItem value="premium">Premium (Completo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {errors.general && <p className="text-sm text-destructive text-center">{errors.general}</p>}

            <Button type="submit" className="w-full py-6 rounded-xl text-base font-semibold gap-2 mt-6" disabled={loading}>
              {loading ? "Cadastrando..." : <> Iniciar Teste <ArrowRight className="w-5 h-5" /></>}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}