import { db } from "./config";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp, getDoc 
} from "firebase/firestore";
import { ProdutoTirzepatida } from "./produtos";

export type StatusPagamento = 'Pendente' | 'Pago' | 'Atrasado';
export type FormaPagamento = 'Dinheiro' | 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Transferência' | 'Crediário';

export interface Venda {
  id?: string;
  clienteId: string;
  clienteNome: string; // Desnormalizado para facilitar listagem
  produtoId: string;
  loteComprado: string; // Desnormalizado
  volume: string;
  quantidade: number;
  valorTotal: number;
  valorAquisicaoUnidade: number; // Persistência do custo no ato da venda para histórico real
  formaPagamento: FormaPagamento;
  parcelas: number;
  parcelasPagas: number; // Novo controle
  statusPagamento: StatusPagamento;
  dataCompra?: any; // Timestamp do Firestore ou Date enviado
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "vendas";

export const subscribeVendas = (callback: (vendas: Venda[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("dataCompra", "desc"));
  return onSnapshot(q, (snapshot) => {
    const vendas: Venda[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Venda[];
    callback(vendas);
  });
};

export const addVendaEReduzirEstoque = async (vendaData: Omit<Venda, 'id'|'createdAt'|'updatedAt'>) => {
  // 1. Pega o produto atual para verificar estoque
  const produtoRef = doc(db, "produtos", vendaData.produtoId);
  const produtoSnap = await getDoc(produtoRef);
  
  if (!produtoSnap.exists()) {
    throw new Error("Produto não encontrado no estoque.");
  }

  const produto = produtoSnap.data() as ProdutoTirzepatida;
  
  if (produto.emEstoque < vendaData.quantidade) {
    throw new Error(`Estoque insuficiente. Restam apenas ${produto.emEstoque} ampolas do lote ${produto.lote}.`);
  }

  // 2. Cria a venda
  // Se veio string no dataCompra, criamos um obj Date
  let dataResolvida: any = serverTimestamp();
  if (vendaData.dataCompra) {
    // Adicionamos T12:00:00 para forçar o timezone local do browser a cair no mesmo dia
    const [ano, mes, dia] = vendaData.dataCompra.split('-');
    dataResolvida = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  const payload = { ...vendaData };
  delete payload.dataCompra; // Removemos da desestruturação para mandar o resolvida
  
  // Se o valor de aquisição não veio (legado), tentamos pegar do produto agora
  const custoUnidade = vendaData.valorAquisicaoUnidade || produto.valorAquisicao || 0;

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...payload,
    valorAquisicaoUnidade: custoUnidade,
    dataCompra: dataResolvida,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // 3. Reduz o estoque na collection produtos
  await updateDoc(produtoRef, {
    emEstoque: produto.emEstoque - vendaData.quantidade,
    updatedAt: serverTimestamp()
  });

  return docRef.id;
};

export const updateVendaStatus = async (id: string, statusPagamento: StatusPagamento) => {
  const vendaRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(vendaRef, {
    statusPagamento,
    updatedAt: serverTimestamp()
  });
};

export const updateVenda = async (id: string, updateData: Partial<Venda>) => {
  const vendaRef = doc(db, COLLECTION_NAME, id);
  
  // Tratamento da data: se vier como string YYYY-MM-DD
  const payload = { ...updateData };
  if (updateData.dataCompra && typeof updateData.dataCompra === 'string') {
    const [ano, mes, dia] = updateData.dataCompra.split('-');
    payload.dataCompra = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0);
  }

  await updateDoc(vendaRef, {
    ...payload,
    updatedAt: serverTimestamp()
  });
};

export const updateVendaParcelas = async (id: string, parcelasPagas: number) => {
  const vendaRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(vendaRef, {
    parcelasPagas,
    updatedAt: serverTimestamp()
  });
};

export const deleteVendaEVoltarEstoque = async (venda: Venda) => {
  if (!venda.id) return;

  // 1. Deleta a Venda
  const vendaRef = doc(db, COLLECTION_NAME, venda.id);
  await deleteDoc(vendaRef);

  // 2. Devolve o estoque
  if (venda.produtoId) {
    const produtoRef = doc(db, "produtos", venda.produtoId);
    const produtoSnap = await getDoc(produtoRef);
    if (produtoSnap.exists()) {
      const produto = produtoSnap.data() as ProdutoTirzepatida;
      await updateDoc(produtoRef, {
        emEstoque: produto.emEstoque + venda.quantidade,
        updatedAt: serverTimestamp()
      });
    }
  }
};
