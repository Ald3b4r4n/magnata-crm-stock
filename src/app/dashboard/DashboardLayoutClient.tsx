"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, Package, Users, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  pathname: string;
  user: any;
  logout: () => void;
  onLinkClick?: () => void;
}

const SidebarContent = ({ pathname, user, logout, onLinkClick }: SidebarProps) => {
  const navLinks = [
    { name: "Dashboard BI", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestão de Clientes", href: "/dashboard/clientes", icon: Users },
    { name: "Gestão de Estoque", href: "/dashboard/estoque", icon: Package },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-xl shadow-lg shadow-amber-900/20">
           <Activity className="h-6 w-6 text-black" />
        </div>
        <div>
           <h2 className="font-bold text-xl tracking-tight leading-none text-white">Magnata</h2>
           <span className="text-zinc-500 font-medium text-xs tracking-widest uppercase text-[10px]">CRM & Stock</span>
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
              onClick={onLinkClick}
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
        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5 overflow-hidden">
           <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Logado como</p>
           <p className="text-xs font-medium text-zinc-300 truncate">{user?.email || 'admin@magnata.com'}</p>
        </div>
        <Button variant="ghost" onClick={logout} className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10 h-11 rounded-xl text-sm">
          <LogOut className="mr-3 h-4 w-4" />
          Sair do Cofre
        </Button>
      </div>
    </div>
  );
};

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/60 backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-1.5 rounded-lg">
            <Activity className="h-4 w-4 text-black" />
          </div>
          <h1 className="font-bold text-lg text-white">Magnata <span className="text-amber-500 font-normal text-xs uppercase tracking-tighter">CRM</span></h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-zinc-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-zinc-950 p-6 z-50 border-r border-white/10"
          >
            <SidebarContent pathname={pathname} user={user} logout={logout} onLinkClick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (lg:flex) */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl p-6 flex-col shadow-2xl relative z-10"
      >
        <SidebarContent pathname={pathname} user={user} logout={logout} />
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8 lg:p-10">
        {/* Subtle Background Glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <motion.div 
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 min-h-full"
        >
           {children}
        </motion.div>
      </main>
    </div>
  );
}
