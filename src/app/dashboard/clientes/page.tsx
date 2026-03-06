"use client";
import React, { useEffect, useState } from "react";
import { Cliente, subscribeClientes, addCliente, deleteCliente, updateCliente } from "@/lib/firebase/clientes";
import { Venda, subscribeVendas, addVendaEReduzirEstoque, deleteVendaEVoltarEstoque, updateVendaStatus, updateVendaParcelas, updateVenda, StatusPagamento, FormaPagamento } from "@/lib/firebase/vendas";
import { ProdutoTirzepatida, subscribeEstoque } from "@/lib/firebase/produtos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trash2, MessageCircle, ShoppingBag, Download, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { exportToCsv, exportToPdf } from "@/lib/utils/exportFiles";

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<'carteira' | 'vendas'>('carteira');
  
  const getHojeLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  // Data States
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [estoque, setEstoque] = useState<ProdutoTirzepatida[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [currentPageClientes, setCurrentPageClientes] = useState(1);
  const [currentPageVendas, setCurrentPageVendas] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [isModalClienteOpen, setIsModalClienteOpen] = useState(false);
  const [formCliente, setFormCliente] = useState<Partial<Cliente>>({ nome: '', telefone: '' });
  
  const [isModalVendaOpen, setIsModalVendaOpen] = useState(false);
  const [formVenda, setFormVenda] = useState<Partial<Venda>>({
    clienteId: '', produtoId: '', quantidade: 1, valorTotal: 0, statusPagamento: 'Pendente',
    formaPagamento: 'Dinheiro', parcelas: 1, parcelasPagas: 0, dataCompra: getHojeLocal()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubClientes = subscribeClientes(data => { setClientes(data); checkLoading(); });
    const unsubVendas = subscribeVendas(data => { setVendas(data); checkLoading(); });
    const unsubEstoque = subscribeEstoque(data => { setEstoque(data); checkLoading(); });

    let loadedCount = 0;
    function checkLoading() {
      loadedCount++;
      if (loadedCount >= 3) setLoading(false);
    }
    
    return () => { unsubClientes(); unsubVendas(); unsubEstoque(); };
  }, []);

  // --- Funções de Cliente ---
  const handleSaveCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!formCliente.nome || !formCliente.telefone) return alert('Preencha os campos obrigatórios');
      if (formCliente.id) {
        await updateCliente(formCliente.id, formCliente);
      } else {
        await addCliente(formCliente as Omit<Cliente, 'id'>);
      }
      setIsModalClienteOpen(false);
      setFormCliente({ nome: '', telefone: '' });
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o cliente");
    } finally { setIsSubmitting(false); }
  };

  const handleEditCliente = (c: Cliente) => {
    setFormCliente(c);
    setIsModalClienteOpen(true);
  };

  const handleAddClienteClick = () => {
    setFormCliente({ nome: '', telefone: '' });
    setIsModalClienteOpen(true);
  };

  const handleDeleteCliente = async (id: string) => {
    if (confirm("Gostaria de excluir completamente o registro do cliente? As compras antigas dele permanecerão como histórico.")) {
      await deleteCliente(id);
    }
  };

  const openWhatsApp = (telefone: string, nome: string) => {
    const limpo = telefone.replace(/\D/g, ''); 
    const msg = encodeURIComponent(`Olá ${nome}, tudo bem? Aqui é do Magnata CRM. Referente a aquisição de nossas ampolas...`);
    window.open(`https://wa.me/${limpo}?text=${msg}`, '_blank');
  };

  // --- Funções de Venda ---
  const handleSaveVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formVenda.clienteId) return alert('Selecione um cliente válido.');

    setIsSubmitting(true);
    try {
      if (formVenda.id) {
        await updateVenda(formVenda.id, {
          clienteId: formVenda.clienteId,
          valorTotal: formVenda.valorTotal,
          formaPagamento: formVenda.formaPagamento,
          parcelas: formVenda.parcelas,
          statusPagamento: formVenda.statusPagamento,
          dataCompra: formVenda.dataCompra
        });
      } else {
        if (!formVenda.produtoId) throw new Error("Selecione um produto");
        const clienteFound = clientes.find(c => c.id === formVenda.clienteId);
        const produtoFound = estoque.find(p => p.id === formVenda.produtoId);

        if(!clienteFound || !produtoFound) throw new Error("Referência de DB Inválida.");

        await addVendaEReduzirEstoque({
          clienteId: clienteFound.id!,
          clienteNome: clienteFound.nome,
          produtoId: produtoFound.id!,
          loteComprado: produtoFound.lote,
          volume: produtoFound.volume,
          quantidade: formVenda.quantidade || 1,
          valorTotal: formVenda.valorTotal || 0,
          valorAquisicaoUnidade: produtoFound.valorAquisicao,
          formaPagamento: formVenda.formaPagamento as FormaPagamento,
          parcelas: formVenda.parcelas || 1,
          parcelasPagas: formVenda.parcelasPagas || 0,
          statusPagamento: formVenda.statusPagamento as StatusPagamento,
          dataCompra: formVenda.dataCompra
        });
      }

      setIsModalVendaOpen(false);
      setFormVenda({ clienteId: '', produtoId: '', quantidade: 1, valorTotal: 0, statusPagamento: 'Pendente', formaPagamento: 'Dinheiro', parcelas: 1, parcelasPagas: 0, dataCompra: getHojeLocal() });
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Erro ao registrar/editar venda.");
      }
    } finally { setIsSubmitting(false); }
  };

  const handleEditVenda = (v: Venda) => {
    setFormVenda({
      ...v,
      dataCompra: v.dataCompra?.toDate ? new Date(v.dataCompra.toDate().getTime() + Math.abs(v.dataCompra.toDate().getTimezoneOffset() * 60000)).toISOString().split('T')[0] : getHojeLocal()
    });
    setIsModalVendaOpen(true);
  };

  const handleAddVendaClick = () => {
    setFormVenda({ clienteId: '', produtoId: '', quantidade: 1, valorTotal: 0, statusPagamento: 'Pendente', formaPagamento: 'Dinheiro', parcelas: 1, parcelasPagas: 0, dataCompra: getHojeLocal() });
    setIsModalVendaOpen(true);
  };

  const handleDeleteVenda = async (venda: Venda) => {
    if (confirm("Gostaria de excluir esta venda? O valor será removido do BI e a ampola RETORNARÁ para o estoque.")) {
      await deleteVendaEVoltarEstoque(venda);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StatusPagamento) => {
    await updateVendaStatus(id, newStatus);
  };

  const handleMudarParcela = async (venda: Venda, incremento: number) => {
    if (!venda.id) return;
    const novasPagas = Math.max(0, Math.min(venda.parcelas, (venda.parcelasPagas || 0) + incremento));
    
    // Auto-completar Status se terminou de pagar tudo
    if (novasPagas === venda.parcelas && venda.statusPagamento !== 'Pago') {
       await updateVendaStatus(venda.id, 'Pago');
    }
    await updateVendaParcelas(venda.id, novasPagas);
  };

  const exportarClientesCSV = () => {
    exportToCsv("Relatorio_Clientes_Frequentes", [
      { header: "Nome", dataKey: "nome" },
      { header: "Telefone", dataKey: "telefone" },
      { header: "Cliente Desde", dataKey: "_dataCadastro" }
    ], clientes.map(c => ({
      ...c,
      _dataCadastro: c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'
    })));
  };

  const exportarClientesPDF = () => {
    exportToPdf("Relatorio_Clientes_Frequentes", "Carteira de Clientes", [
      { header: "Nome", dataKey: "nome" },
      { header: "Telefone", dataKey: "telefone" },
      { header: "Cliente Desde", dataKey: "_dataCadastro" }
    ], clientes.map(c => ({
      ...c,
      _dataCadastro: c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'
    })));
  };

  const exportarVendasCSV = () => {
    exportToCsv("Relatorio_Vendas_Estoque", [
      { header: "Data Venda", dataKey: "_data" },
      { header: "Cliente", dataKey: "clienteNome" },
      { header: "Produto", dataKey: "loteComprado" },
      { header: "Volume", dataKey: "volume" },
      { header: "Quantidade", dataKey: "quantidade" },
      { header: "Valor Final", dataKey: "_valor" },
      { header: "Método", dataKey: "formaPagamento" },
      { header: "Parcelas", dataKey: "_parcelas" },
      { header: "Status", dataKey: "statusPagamento" }
    ], vendas.map(v => ({
      ...v,
      _data: v.dataCompra?.toDate ? new Date(v.dataCompra.toDate().getTime() + Math.abs(v.dataCompra.toDate().getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR') : '',
      _valor: `R$ ${v.valorTotal.toFixed(2)}`,
      _parcelas: v.parcelas > 1 ? `${v.parcelasPagas||0}/${v.parcelas}` : 'À Vista'
    })));
  };

  const exportarVendasPDF = () => {
    exportToPdf("Relatorio_Vendas_Estoque", "Histórico de Transações", [
      { header: "Data Venda", dataKey: "_data" },
      { header: "Cliente", dataKey: "clienteNome" },
      { header: "Lote/Ampola", dataKey: "loteComprado" },
      { header: "Qtd", dataKey: "quantidade" },
      { header: "Valor Total", dataKey: "_valor" },
      { header: "Pagamento", dataKey: "_parcelas" },
      { header: "Status", dataKey: "statusPagamento" }
    ], vendas.map(v => ({
      ...v,
      _data: v.dataCompra?.toDate ? new Date(v.dataCompra.toDate().getTime() + Math.abs(v.dataCompra.toDate().getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR') : '',
      _valor: `R$ ${v.valorTotal.toFixed(2)}`,
      _parcelas: v.parcelas > 1 ? `${v.formaPagamento} (${v.parcelasPagas||0}/${v.parcelas})` : v.formaPagamento
    })));
  };

  const paginatedClientes = clientes.slice((currentPageClientes - 1) * itemsPerPage, currentPageClientes * itemsPerPage);
  const totalPagesClientes = Math.ceil(clientes.length / itemsPerPage);

  const paginatedVendas = vendas.slice((currentPageVendas - 1) * itemsPerPage, currentPageVendas * itemsPerPage);
  const totalPagesVendas = Math.ceil(vendas.length / itemsPerPage);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div className="max-w-full">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">Relacionamento e <span className="font-semibold text-amber-500">Vendas</span></h1>
          <p className="text-sm md:text-base text-zinc-400">Gerencie sua carteira de clientes fixos e registre o histórico operacional de vendas vinculadas ao estoque.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
           <button 
             onClick={() => setActiveTab('carteira')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md font-medium text-xs md:text-sm transition-all ${activeTab === 'carteira' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
           >
             Carteira de Clientes
           </button>
           <button 
             onClick={() => setActiveTab('vendas')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-md font-medium text-xs md:text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'vendas' ? 'bg-amber-600/20 text-amber-500 shadow-md border border-amber-500/20' : 'text-zinc-400 hover:text-amber-400/80 hover:bg-amber-500/5'}`}
           >
             Registro de Vendas
           </button>
        </div>
      </header>

      {/* VIEW: CARTEIRA DE CLIENTES */}
      {activeTab === 'carteira' && (
        <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} transition={{duration:0.3}}>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
            <div className="flex gap-2">
               <Button onClick={exportarClientesCSV} variant="outline" className="flex-1 sm:flex-none h-9 text-xs border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300">
                 <Download className="w-3 h-3 mr-2 text-zinc-400" /> CSV
               </Button>
               <Button onClick={exportarClientesPDF} variant="outline" className="flex-1 sm:flex-none h-9 text-xs border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500">
                 <Download className="w-3 h-3 mr-2" /> PDF
               </Button>
            </div>
            
             <Dialog open={isModalClienteOpen} onOpenChange={setIsModalClienteOpen}>
               <DialogTrigger asChild>
                 <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 w-full sm:w-auto" onClick={handleAddClienteClick}>
                   <Plus className="w-4 h-4 mr-2" /> Cadastrar Cliente
                 </Button>
               </DialogTrigger>
               <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                 <DialogHeader>
                   <DialogTitle>{formCliente.id ? "Editar Cliente" : "Novo Cadastro de Cliente"}</DialogTitle>
                   <DialogDescription>{formCliente.id ? "Altere as informações deste cliente." : "Crie um registro de contato para a carteira de clientes fixos."}</DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleSaveCliente} className="space-y-4 mt-4">
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Nome Completo</Label>
                     <Input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} className="bg-zinc-900 border-white/10" placeholder="Ex: Dr. Roberto" />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Telefone (WhatsApp)</Label>
                     <Input required value={formCliente.telefone} onChange={e => setFormCliente({...formCliente, telefone: e.target.value})} className="bg-zinc-900 border-white/10" placeholder="551199999999" />
                   </div>
                   <Button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 mt-6">
                     {isSubmitting ? "Salvando..." : "Registrar"}
                   </Button>
                 </form>
               </DialogContent>
             </Dialog>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
               <div className="min-w-[600px] sm:min-w-0">
                  <Table>
                  <TableHeader className="bg-black/40">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-zinc-400 font-medium h-12">Perfil do Cliente</TableHead>
                      <TableHead className="text-zinc-400 font-medium text-right">Comunicação</TableHead>
                      <TableHead className="text-zinc-400 font-medium w-[80px] text-center">Gestão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow className="border-white/5"><TableCell colSpan={3} className="h-32 text-center text-zinc-500">Carregando carteira...</TableCell></TableRow>
                    ) : paginatedClientes.length === 0 ? (
                      <TableRow className="border-white/5"><TableCell colSpan={3} className="h-48 text-center text-zinc-500"><Users className="w-10 h-10 mx-auto mb-3 opacity-20" />Nenhum cliente fixo cadastrado.</TableCell></TableRow>
                    ) : (
                      paginatedClientes.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white-[0.02] transition-colors group">
                          <TableCell className="font-medium align-middle">
                            <div className="text-white font-semibold">{item.nome}</div>
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">{item.telefone}</div>
                            {item.createdAt?.toDate && (
                               <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">Cliente desde: {item.createdAt.toDate().toLocaleDateString()}</div>
                            )}
                          </TableCell>
                          <TableCell className="align-middle text-right">
                            <Button variant="ghost" onClick={() => openWhatsApp(item.telefone, item.nome)} className="h-8 md:h-9 px-2 md:px-3 gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all border border-emerald-500/20 text-xs">
                              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" /> WhatsApp
                            </Button>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10" onClick={() => handleEditCliente(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteCliente(item.id!)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          {/* Client Pagination Controls */}
          {totalPagesClientes > 1 && (
            <div className="flex items-center justify-between mt-4 gap-2 bg-zinc-900/30 p-2 rounded-lg border border-white/5">
              <Button variant="ghost" size="sm" onClick={() => setCurrentPageClientes(p => Math.max(1, p - 1))} disabled={currentPageClientes === 1} className="text-zinc-400 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <div className="text-xs text-zinc-500 font-medium">Página {currentPageClientes} de {totalPagesClientes}</div>
              <Button variant="ghost" size="sm" onClick={() => setCurrentPageClientes(p => Math.max(1, Math.min(totalPagesClientes, p + 1)))} disabled={currentPageClientes === totalPagesClientes} className="text-zinc-400 hover:text-white">
                Próxima <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* VIEW: HISTÓRICO DE VENDAS */}
      {activeTab === 'vendas' && (
        <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} transition={{duration:0.3}}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-wrap gap-2">
               <Button onClick={exportarVendasCSV} variant="outline" className="h-9 text-xs border-white/10 bg-zinc-900 hover:bg-zinc-800 text-zinc-300">
                 <Download className="w-3 h-3 mr-2 text-zinc-400" /> Exportar CSV
               </Button>
               <Button onClick={exportarVendasPDF} variant="outline" className="h-9 text-xs border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500">
                 <Download className="w-3 h-3 mr-2" /> Gerar PDF
               </Button>
            </div>

            <Dialog open={isModalVendaOpen} onOpenChange={setIsModalVendaOpen}>
               <DialogTrigger asChild>
                 <Button className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20" onClick={handleAddVendaClick}>
                   <Plus className="w-4 h-4 mr-2" /> Registrar Venda & Baixar Estoque
                 </Button>
               </DialogTrigger>
               <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                 <DialogHeader>
                   <DialogTitle>{formVenda.id ? "Editar Venda" : "Registrar Venda e Ocorrência"}</DialogTitle>
                   <DialogDescription>{formVenda.id ? "Edite as condições ou status de uma venda registrada." : "Abater do estoque registrando a compra na conta de um cliente."}</DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleSaveVenda} className="space-y-4 mt-4">
                   
                   <div className="space-y-2">
                     <Label className="text-zinc-400">Selecione o Cliente</Label>
                     <select disabled={!!formVenda.id} required value={formVenda.clienteId} onChange={e => setFormVenda({...formVenda, clienteId: e.target.value})} className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-white/10 text-sm focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50">
                        <option value="" disabled>-- Selecione --</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                     </select>
                   </div>
                   
                   {!formVenda.id ? (
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Selecione o Item do Estoque (Baixa)</Label>
                       <select required value={formVenda.produtoId} onChange={e => {
                           const p = estoque.find(x => x.id === e.target.value);
                           const qtd = formVenda.quantidade || 1;
                           setFormVenda({...formVenda, produtoId: e.target.value, valorTotal: p ? p.valorVenda * qtd : 0});
                         }} className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-white/10 text-sm focus:ring-amber-500 focus:border-amber-500">
                          <option value="" disabled>-- Selecione Lote Ativo --</option>
                          {estoque.filter(e => e.emEstoque > 0).map(p => (
                            <option key={p.id} value={p.id}>({p.lote}) {p.marca} {p.volume} - {p.emEstoque} un. rastreadas</option>
                          ))}
                       </select>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Item Vendido</Label>
                       <Input disabled value={`(${formVenda.loteComprado}) ${formVenda.volume}`} className="bg-zinc-900 border-white/10 text-zinc-500" />
                     </div>
                   )}

                   <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Qtd Comprada</Label>
                       <Input disabled={!!formVenda.id} required type="number" min={1} value={formVenda.quantidade || ''} onChange={e => {
                         const novaQtd = Number(e.target.value);
                         const p = estoque.find(x => x.id === formVenda.produtoId);
                         setFormVenda(prev => ({
                           ...prev, 
                           quantidade: novaQtd, 
                           valorTotal: p ? p.valorVenda * novaQtd : prev.valorTotal
                         }));
                       }} className="bg-zinc-900 border-white/10 disabled:opacity-50" />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Total Venda (R$)</Label>
                       <Input required type="number" step="0.01" value={formVenda.valorTotal || ''} onChange={e => setFormVenda({...formVenda, valorTotal: Number(e.target.value)})} className="bg-zinc-900 border-white/10" />
                       <p className="text-[10px] text-zinc-500 mt-1">Acrescente descontos ou taxas.</p>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Data da Venda</Label>
                       <Input required type="date" value={formVenda.dataCompra || ''} onChange={e => setFormVenda({...formVenda, dataCompra: e.target.value})} className="bg-zinc-900 border-white/10 [color-scheme:dark]" />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Método de Pgto</Label>
                       <select required value={formVenda.formaPagamento} onChange={e => setFormVenda({...formVenda, formaPagamento: e.target.value as FormaPagamento})} className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-white/10 text-sm focus:ring-amber-500 focus:border-amber-500">
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Pix">Pix</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Transferência">Transferência Bancária</option>
                          <option value="Crediário">Crediário</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-zinc-400">Parcelas</Label>
                       <select required disabled={formVenda.formaPagamento !== 'Cartão de Crédito' && formVenda.formaPagamento !== 'Crediário'} value={formVenda.parcelas} onChange={e => setFormVenda({...formVenda, parcelas: Number(e.target.value)})} className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-white/10 text-sm focus:ring-amber-500 focus:border-amber-500 disabled:opacity-50">
                          <option value={1}>À vista (1x)</option>
                          <option value={2}>2x</option>
                          <option value={3}>3x</option>
                          <option value={4}>4x</option>
                          <option value={5}>5x</option>
                          <option value={6}>6x</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                      <Label className="text-zinc-400">Status de Pagamento</Label>
                      <div className="flex gap-2 text-sm mt-1 mb-2">
                         {['Pendente', 'Pago', 'Atrasado'].map(s => (
                            <div key={s} onClick={() => setFormVenda({...formVenda, statusPagamento: s as StatusPagamento})} className={`cursor-pointer px-3 py-1.5 rounded border ${formVenda.statusPagamento === s ? 'bg-amber-600 border-amber-500 text-white' : 'bg-transparent border-zinc-700 text-zinc-400'}`}>
                               {s}
                            </div>
                         ))}
                      </div>
                   </div>

                   <Button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 mt-6">
                     {isSubmitting ? "Sincronizando BI e Estoque..." : "Efetivar Venda e Baixa de Item"}
                   </Button>
                 </form>
               </DialogContent>
             </Dialog>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium h-12">Comprador Fixado</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Produto & Rastreio</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Status & Financeiro</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right w-[80px]">Reversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/5"><TableCell colSpan={4} className="h-32 text-center text-zinc-500">Sincronizando histórico de vendas...</TableCell></TableRow>
                ) : paginatedVendas.length === 0 ? (
                  <TableRow className="border-white/5"><TableCell colSpan={4} className="h-48 text-center text-zinc-500"><ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />O histórico do BI está sem faturamentos.</TableCell></TableRow>
                ) : (
                  paginatedVendas.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white-[0.02] transition-colors group">
                      <TableCell className="font-medium align-middle">
                        <div className="text-white font-semibold">{item.clienteNome}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5 text-ellipsis">
                          {item.dataCompra?.toDate ? (
                            new Date(item.dataCompra.toDate().getTime() + Math.abs(item.dataCompra.toDate().getTimezoneOffset() * 60000)).toLocaleDateString('pt-BR')
                          ) : 'Aguarde...'}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1.5 items-start">
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">{item.loteComprado}</Badge>
                             <span className="text-zinc-400 text-sm font-medium">{item.quantidade}x</span>
                           </div>
                           <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                             {item.formaPagamento} 
                             {item.parcelas > 1 ? (
                               <span className="ml-2 font-semibold text-amber-500">
                                 ( {(item.parcelasPagas || 0)} / {item.parcelas} pagas )
                               </span>
                             ) : ''}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1 items-start">
                             <div className="text-sm font-semibold">R$ {item.valorTotal.toFixed(2)}</div>
                             <select
                               value={item.statusPagamento}
                               onChange={(e) => handleUpdateStatus(item.id!, e.target.value as StatusPagamento)}
                               className={`h-7 px-2 text-xs font-semibold rounded-md outline-none cursor-pointer appearance-none transition-colors border
                                 ${item.statusPagamento === 'Pago' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' : ''}
                                 ${item.statusPagamento === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' : ''}
                                 ${item.statusPagamento === 'Atrasado' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : ''}
                               `}
                             >
                                <option value="Pendente" className="bg-zinc-900 text-amber-500">Pendente</option>
                                <option value="Pago" className="bg-zinc-900 text-emerald-500">Pago</option>
                                <option value="Atrasado" className="bg-zinc-900 text-red-500">Atrasado</option>
                             </select>
                          </div>

                          {/* Controles de Parcelamento (Se Houver Mais de 1 Parcela e não estiver 100% quitado) */}
                          {item.parcelas > 1 && (
                            <div className="flex gap-1 bg-zinc-900 border border-white/5 rounded-md overflow-hidden shrink-0">
                               <button onClick={() => handleMudarParcela(item, -1)} disabled={(item.parcelasPagas || 0) === 0} className="px-2 py-1 text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-20">-</button>
                               <div className="px-2 py-1 text-xs text-zinc-400 font-mono flex items-center bg-black/50">Pgto</div>
                               <button onClick={() => handleMudarParcela(item, 1)} disabled={(item.parcelasPagas || 0) === item.parcelas} className="px-2 py-1 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-20">+</button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10" onClick={() => handleEditVenda(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteVenda(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Sales Pagination Controls */}
        {totalPagesVendas > 1 && (
          <div className="flex items-center justify-between mt-4 gap-2 bg-zinc-900/30 p-2 rounded-lg border border-white/5">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPageVendas(p => Math.max(1, p - 1))} disabled={currentPageVendas === 1} className="text-zinc-400 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <div className="text-xs text-zinc-500 font-medium">Página {currentPageVendas} de {totalPagesVendas}</div>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPageVendas(p => Math.max(1, Math.min(totalPagesVendas, p + 1)))} disabled={currentPageVendas === totalPagesVendas} className="text-zinc-400 hover:text-white">
              Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </motion.div>
      )}
    </motion.div>
  );
}
