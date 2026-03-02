"use client";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirect para o dashboard é gerido de forma reativa pelo AuthContext
    } catch (err: any) {
      setError("Credenciais inválidas. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Premium Background via Nano Banana IA */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: "url('/bg-hero.png')" }}
      />
      
      {/* Glassmorphism gradient effects */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-zinc-950/95 pointer-events-none" />
      <div className="absolute -left-[20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/40 blur-[120px] pointer-events-none" />
      <div className="absolute -right-[20%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-amber-600/20 blur-[120px] pointer-events-none" />

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md border-white/5 bg-zinc-950/60 p-6 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            <img src="/logo.png" alt="Magnata Logo" className="h-[60px] w-[60px] object-contain mix-blend-screen opacity-90 drop-shadow-lg" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-light tracking-tight text-white drop-shadow-sm">
              Magnata <span className="font-semibold text-amber-500">CRM</span>
            </CardTitle>
            <CardDescription className="text-zinc-400 font-medium">
              Gestão de Ativos, Estoque e Clientes
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-zinc-300 font-medium text-xs uppercase tracking-wider">Email Administrativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="gestor@magnata.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-amber-500/50 h-12 transition-all hover:bg-zinc-900/80"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300 font-medium text-xs uppercase tracking-wider">Senha de Segurança</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-amber-500/50 h-12 transition-all hover:bg-zinc-900/80"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-medium text-base transition-all shadow-lg shadow-amber-900/20"
              disabled={loading}
            >
              {loading ? "Acessando cofre..." : "Entrar no Sistema"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
