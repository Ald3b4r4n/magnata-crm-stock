"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, DollarSign, Package, Download } from "lucide-react";
import { ProdutoTirzepatida, subscribeEstoque } from "@/lib/firebase/produtos";
import { Venda, subscribeVendas } from "@/lib/firebase/vendas";
import { motion } from "framer-motion";
import { exportToCsv, exportToPdf } from "@/lib/utils/exportFiles";
import { Button } from "@/components/ui/button";

export default function DashboardBI() {
  const [estoque, setEstoque] = useState<ProdutoTirzepatida[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  useEffect(() => {
    const unsubEstoque = subscribeEstoque((data) => setEstoque(data));
    const unsubVendas = subscribeVendas((data) => setVendas(data));
    return () => {
      unsubEstoque();
      unsubVendas();
    };
  }, []);

  // -- CÁLCULOS DO BI GLOBAL --

  // 1. Giro de Estoque
  const totalAmpolasAtivas = estoque.reduce((acc, item) => acc + item.emEstoque, 0);
  const ampolasCriticAS = estoque.filter(item => item.emEstoque > 0 && item.emEstoque <= 5).length;
  
  // Agrupando por marca as ampolas ativas
  const estoquePorMarca = estoque.reduce((acc, item) => {
    if (item.emEstoque > 0) {
      if (!acc[item.marca]) {
        acc[item.marca] = 0;
      }
      acc[item.marca] += item.emEstoque;
    }
    return acc;
  }, {} as Record<string, number>);

  // 2. Lucros Total (Geral)
  let lucroBrutoGeral = 0;
  let custoGeral = 0;

  // 3. Estruturação Analítica Mensal (Para o Gráfico)
  const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const historicoMensalMap = new Map<string, { lucro_bruto: number, custo: number }>();

  vendas.forEach(venda => {
    // Calculando custo dessa venda: Prioridade para o custo persistido no ato da venda
    // Se não houver (legado), busca no lote atual do estoque
    const custoPersistido = venda.valorAquisicaoUnidade;
    let custoVenda = 0;

    if (custoPersistido !== undefined && custoPersistido !== null) {
      custoVenda = custoPersistido * venda.quantidade;
    } else {
      const produtoRelacionado = estoque.find(p => p.lote.toUpperCase() === venda.loteComprado.toUpperCase());
      if (produtoRelacionado) {
        custoVenda = produtoRelacionado.valorAquisicao * venda.quantidade;
      }
    }

    lucroBrutoGeral += venda.valorTotal;
    custoGeral += custoVenda;

    // Coloca no Gráfico (Agrupando por Mês/Ano)
    if (venda.dataCompra && venda.dataCompra.toDate) {
      // Firebase Timestamps
      const date = venda.dataCompra.toDate();
      // O firestore grava T12:00:00 então o mês não deve variar.
      const monthLabel = `${mesesAbreviados[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      
      if (!historicoMensalMap.has(monthLabel)) {
        historicoMensalMap.set(monthLabel, { lucro_bruto: 0, custo: 0 });
      }
      
      const mesData = historicoMensalMap.get(monthLabel)!;
      mesData.lucro_bruto += venda.valorTotal;
      mesData.custo += custoVenda;
    }
  });

  const lucroLiquidoGeral = lucroBrutoGeral - custoGeral;
  let margemGlobal = 0;
  if (lucroBrutoGeral > 0) {
    margemGlobal = (lucroLiquidoGeral / lucroBrutoGeral) * 100;
  }

  // Prepara Array pro Chart (ordena cronologicamente caso haja)
  // O Map preserva ordem de inserção mas como vêm decrescente, vamos reverter.
  const chartData = Array.from(historicoMensalMap.entries())
    .map(([name, valores]) => ({
      name,
      lucro_bruto: valores.lucro_bruto,
      custo: valores.custo,
      lucro_liquido: valores.lucro_bruto - valores.custo
    })).reverse(); // .reverse() porque o getClientes traz do mais novo pro mais velho

  const exportarBICsv = () => {
    exportToCsv("Relatorio_Financeiro_BI", [
      { header: "Período", dataKey: "name" },
      { header: "Custo Operacional", dataKey: "_custo" },
      { header: "Lucro Bruto (Venda)", dataKey: "_bruto" },
      { header: "Lucro Líquido", dataKey: "_liquido" }
    ], chartData.map(c => ({
      ...c,
      _custo: `R$ ${c.custo.toFixed(2)}`,
      _bruto: `R$ ${c.lucro_bruto.toFixed(2)}`,
      _liquido: `R$ ${c.lucro_liquido.toFixed(2)}`
    })));
  };

  const exportarBIPdf = () => {
    exportToPdf("Relatorio_Financeiro_BI", "Fluxo de Caixa Consolidado (BI)", [
      { header: "Período", dataKey: "name" },
      { header: "Custo Operacional", dataKey: "_custo" },
      { header: "Lucro Bruto (Venda)", dataKey: "_bruto" },
      { header: "Lucro Líquido", dataKey: "_liquido" }
    ], chartData.map(c => ({
      ...c,
      _custo: `R$ ${c.custo.toFixed(2)}`,
      _bruto: `R$ ${c.lucro_bruto.toFixed(2)}`,
      _liquido: `R$ ${c.lucro_liquido.toFixed(2)}`
    })));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="max-w-full">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">Business Intelligence <span className="font-semibold text-amber-500">Global</span></h1>
          <p className="text-sm md:text-base text-zinc-400">Acompanhamento consolidado de ativos, lucros de Tirzepatida e saúde financeira em <strong className="text-amber-500">Tempo Real</strong>.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <Button onClick={exportarBICsv} variant="outline" className="flex-1 md:flex-none h-9 text-xs border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300">
              <Download className="w-3 h-3 mr-2 text-zinc-400" /> CSV
           </Button>
           <Button onClick={exportarBIPdf} variant="outline" className="flex-1 md:flex-none h-9 text-xs border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500">
              <Download className="w-3 h-3 mr-2" /> PDF
           </Button>
        </div>
      </header>

      {/* Métrica Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-md shadow-xl hover:bg-zinc-900/60 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Faturamento Bruto (Volume de Vendas)</CardTitle>
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroBrutoGeral)}
              </div>
              {vendas.length > 0 && (
                <p className="text-[10px] md:text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 inline-block px-2 py-1 rounded">
                  Baseado em {vendas.length} operações
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-md shadow-xl hover:bg-zinc-900/60 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Lucro Real (Faturamento - Aquisição)</CardTitle>
              <div className="bg-amber-500/20 p-2 rounded-full">
                <Activity className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroLiquidoGeral)}
              </div>
              <p className="text-[10px] md:text-xs text-amber-500 mt-2 font-medium bg-amber-500/10 inline-block px-2 py-1 rounded">
                Margem operacional média de {margemGlobal.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="sm:col-span-2 lg:col-span-1"
        >
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-md shadow-xl hover:bg-zinc-900/60 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">Giro de Estoque</CardTitle>
              <div className="bg-indigo-500/20 p-2 rounded-full">
                <Package className="h-4 w-4 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-3">
                 <div className="text-2xl md:text-3xl font-bold text-white">{totalAmpolasAtivas}</div>
                 <span className="text-xs md:text-sm font-medium text-zinc-500">ampolas totais ativas</span>
              </div>

              <div className="space-y-1.5 mb-2">
                {Object.entries(estoquePorMarca).map(([marca, qtd]) => (
                  <div key={marca} className="flex justify-between items-center text-xs text-zinc-400 bg-white/5 px-2 py-1.5 rounded-md">
                    <span className="font-medium text-zinc-300">{marca}</span>
                    <span className="font-bold text-indigo-400">{qtd} un</span>
                  </div>
                ))}
              </div>

              {ampolasCriticAS > 0 && (
                <p className="text-[10px] md:text-xs text-indigo-400 mt-3 font-medium bg-indigo-500/10 inline-block px-2 py-1 rounded w-full text-center">
                  {ampolasCriticAS} lote(s) em estágio crítico (≤ 5)
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-black/40 border-white/5 p-4 md:p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <h2 className="text-base md:text-lg font-semibold text-white mb-6 md:mb-8 flex items-center gap-2">
             <Activity size={18} className="text-amber-500" />
             Desempenho Financeiro Mensal (Tempo Real)
          </h2>
          {chartData.length === 0 ? (
             <div className="h-[300px] md:h-[450px] w-full flex items-center justify-center text-zinc-500 flex-col gap-3">
               <Activity size={48} className="opacity-20 text-white" />
               <p className="text-sm text-center px-4">Aguardando as primeiras vendas entrarem no sistema para gerar o Analytics.</p>
             </div>
          ) : (
            <div className="h-[300px] md:h-[450px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#52525b" 
                    tick={{fill: '#a1a1aa', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#52525b" 
                    tick={{fill: '#a1a1aa', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
                  />
                  <Tooltip 
                    formatter={(value: number | string | Array<number | string> | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))}
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#27272a', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                      fontSize: '11px',
                      padding: '8px'
                    }}
                    itemStyle={{color: '#e4e4e7', padding: '2px 0'}}
                    labelStyle={{color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px'}}
                  />
                  <Line type="step" dataKey="lucro_bruto" name="L. Bruto (Venda)" stroke="#34d399" strokeWidth={2.5} dot={{r: 3, strokeWidth: 1.5, fill: '#09090b'}} activeDot={{r: 5, stroke: '#34d399', strokeWidth: 2}} />
                  <Line type="monotone" dataKey="lucro_liquido" name="L. Líquido Real" stroke="#f59e0b" strokeWidth={2.5} dot={{r: 3, strokeWidth: 1.5, fill: '#09090b'}} activeDot={{r: 5, stroke: '#f59e0b', strokeWidth: 2}} />
                  <Line type="monotone" dataKey="custo" name="Custo Base" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 5" dot={false} activeDot={{r: 3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
