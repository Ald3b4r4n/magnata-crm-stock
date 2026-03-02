import React from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Magnata CRM",
  description: "Painel de controle de ativos e clientes - Magnata Stock.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
