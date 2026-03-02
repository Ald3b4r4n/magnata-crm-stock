"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, Package, Users, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard BI", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestão de Clientes", href: "/dashboard/clientes", icon: Users },
    { name: "Gestão de Estoque", href: "/dashboard/estoque", icon: Package },
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden">
      {/* Premium Sidebar */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-72 border-r border-white/5 bg-black/60 backdrop-blur-3xl p-6 flex flex-col shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-xl shadow-lg shadow-amber-900/20">
             <Activity className="h-6 w-6 text-black" />
          </div>
          <div>
             <h2 className="font-bold text-xl tracking-tight leading-none text-white">Magnata</h2>
             <span className="text-zinc-500 font-medium text-xs tracking-widest uppercase">CRM & Stock</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-medium ${
                  isActive 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} className={isActive ? "text-amber-500" : "text-zinc-500"} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
             <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Logado como</p>
             <p className="text-sm font-medium text-zinc-300 truncate">{user?.email || 'admin@magnata.com'}</p>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-12 rounded-xl">
            <LogOut className="mr-3 h-5 w-5" />
            Sair do Cofre
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
        <motion.div 
          key={pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 min-h-full"
        >
           {children}
        </motion.div>
      </main>
    </div>
  );
}
