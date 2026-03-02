"use client";
import React, { useEffect, useState } from "react";
import { ProdutoTirzepatida, subscribeEstoque, addProduto, updateProduto, deleteProduto } from "@/lib/firebase/produtos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, PackageSearch, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { exportToCsv, exportToPdf } from "@/lib/utils/exportFiles";

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<ProdutoTirzepatida[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProdutoTirzepatida>>({ marca: '', volume: '', lote: '', quantidade: 0, valorAquisicao: 0, valorVenda: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Liga o listener Realtime (Optimistic UI - instantâneo)
    const unsubscribe = subscribeEstoque((data) => {
      setEstoque(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Evita salvar duplicado
    setIsSubmitting(true);

    try {
      if (formData.id) {
        // Edit mode (not fully implemented in UI but logic is here)
        await updateProduto(formData.id, formData);
      } else {
        await addProduto(formData as Omit<ProdutoTirzepatida, 'id'|'createdAt'|'updatedAt'>);
      }
      setIsModalOpen(false);
      setFormData({ marca: '', volume: '', lote: '', quantidade: 0, valorAquisicao: 0, valorVenda: 0 });
      // Remover loadData pois o onSnapshot se encarrega
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta entrada de lote do sistema? (Pode afetar o BI)")) {
      await deleteProduto(id);
    }
  };

  const exportarEstoqueCSV = () => {
    exportToCsv("Relatorio_Posicao_Estoque", [
      { header: "Cod Lote", dataKey: "lote" },
      { header: "Marca", dataKey: "marca" },
      { header: "Volumetria", dataKey: "volume" },
      { header: "Físico Atual", dataKey: "_fisico" },
      { header: "Aquisição UN", dataKey: "_custo" },
      { header: "Venda UN", dataKey: "_venda" },
      { header: "Entrada em", dataKey: "_data" }
    ], estoque.map(e => ({
      ...e,
      _fisico: `${e.quantidade} disponíveis`,
      _custo: `R$ ${e.valorAquisicao.toFixed(2)}`,
      _venda: `R$ ${e.valorVenda.toFixed(2)}`,
      _data: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'
    })));
  };

  const exportarEstoquePDF = () => {
    exportToPdf("Relatorio_Posicao_Estoque", "Posição Física de Estoque", [
      { header: "Lote / Marca", dataKey: "_lote" },
      { header: "Volume", dataKey: "volume" },
      { header: "Físico", dataKey: "_fisico" },
      { header: "Entrada em", dataKey: "_data" },
      { header: "Custo (R$)", dataKey: "_custo" },
      { header: "Venda (R$)", dataKey: "_venda" }
    ], estoque.map(e => ({
      ...e,
      _lote: `${e.lote} (${e.marca})`,
      _fisico: `${e.quantidade} unidades`,
      _custo: `R$ ${e.valorAquisicao.toFixed(2)}`,
      _venda: `R$ ${e.valorVenda.toFixed(2)}`,
      _data: e.createdAt?.toDate ? e.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'
    })));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto"
    >
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div className="max-w-full">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">Gestão de <span className="font-semibold text-amber-500">Estoque</span></h1>
          <p className="text-sm md:text-base text-zinc-400">Controle rigoroso de lotes e volumetria das ampolas de Tirzepatida aprovadas.</p>
        </div>
        <div className="flex w-full md:w-auto flex-wrap gap-2">
            <Button onClick={exportarEstoqueCSV} variant="outline" className="flex-1 md:flex-none h-9 text-xs border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300">
               <Download className="w-3 h-3 mr-2 text-zinc-400" /> CSV
            </Button>
            <Button onClick={exportarEstoquePDF} variant="outline" className="flex-1 md:flex-none h-9 text-xs border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500">
               <Download className="w-3 h-3 mr-2" /> PDF
            </Button>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 w-full md:w-auto transition-transform active:scale-95">
                  <Plus className="w-4 h-4 mr-2" /> Entrada
                </Button>
              </DialogTrigger>
             <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
               <DialogHeader>
                 <DialogTitle>Registrar Lote de Tirzepatida</DialogTitle>
                 <DialogDescription>
                   Insira os dados da nova compra de estoque para acompanhamento no sistema.
                 </DialogDescription>
               </DialogHeader>
               <form onSubmit={handleSave} className="space-y-4 mt-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Marca</Label>
                     <Input required value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="bg-zinc-900 border-white/10" placeholder="Ex: Mounjaro" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Volume</Label>
                     <Input required value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} className="bg-zinc-900 border-white/10" placeholder="Ex: 10mg" />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label className="text-zinc-400">Número do Lote</Label>
                   <Input required value={formData.lote} onChange={e => setFormData({...formData, lote: e.target.value})} className="bg-zinc-900 border-white/10 uppercase" placeholder="LOTE-123X" />
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Qtd Ampolas</Label>
                     <Input required type="number" min={1} value={formData.quantidade || ''} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} className="bg-zinc-900 border-white/10" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Custo UN (R$)</Label>
                     <Input required type="number" step="0.01" value={formData.valorAquisicao || ''} onChange={e => setFormData({...formData, valorAquisicao: Number(e.target.value)})} className="bg-zinc-900 border-white/10" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Venda UN (R$)</Label>
                     <Input required type="number" step="0.01" value={formData.valorVenda || ''} onChange={e => setFormData({...formData, valorVenda: Number(e.target.value)})} className="bg-zinc-900 border-white/10" />
                   </div>
                 </div>

                 <Button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 mt-4">
                   {isSubmitting ? "Autenticando e Salvando..." : "Salvar no Cofre"}
                 </Button>
               </form>
             </DialogContent>
           </Dialog>
        </div>
      </header>

      {/* Lista de Ativos */}
      <div className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] xl:min-w-0">
            <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium h-12">Lote & Marca</TableHead>
                <TableHead className="text-zinc-400 font-medium">Data de Entrada</TableHead>
                <TableHead className="text-zinc-400 font-medium">Volumetria</TableHead>
                <TableHead className="text-zinc-400 font-medium">Situação Físico</TableHead>
                <TableHead className="text-zinc-400 font-medium text-right">Aquisição / Venda</TableHead>
                <TableHead className="text-zinc-400 font-medium text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                   Buscando lotes criptografados no cofre remoto...
                </TableCell>
              </TableRow>
            ) : estoque.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={6} className="h-48 text-center text-zinc-500">
                   <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-20" />
                   Nenhuma ampola de Tirzepatida cadastrada no momento.
                </TableCell>
              </TableRow>
            ) : (
              estoque.map((item) => (
                <TableRow key={item.id} className="border-white/5 hover:bg-white-[0.02] transition-colors group">
                  <TableCell className="font-medium">
                    <div className="text-white">{item.marca}</div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5 uppercase">{item.lote}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-zinc-400 font-mono">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('pt-BR') : 'Data Indisp.'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      {item.volume}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span className={`h-2 w-2 rounded-full ${item.emEstoque > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                       <span className={item.emEstoque > 0 ? "text-zinc-300" : "text-red-400 font-medium"}>
                         {item.emEstoque} de {item.quantidade} ativas
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-zinc-500 text-[11px] mb-0.5 font-medium uppercase tracking-wider">Custo UN: <span className="text-zinc-300 normal-case tracking-normal">R$ {item.valorAquisicao.toFixed(2)}</span></div>
                    <div className="text-emerald-500/80 text-[11px] font-medium uppercase tracking-wider">Venda UN: <span className="text-emerald-400 font-bold normal-case tracking-normal">R$ {item.valorVenda.toFixed(2)}</span></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDelete(item.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
}
