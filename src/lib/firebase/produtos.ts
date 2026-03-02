import { db } from "./config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from "firebase/firestore";

// Definindo a interface da Ampola no Estoque
export interface ProdutoTirzepatida {
  id?: string;
  marca: string;
  volume: string; // Ex: 10mg, 15mg
  lote: string;
  quantidade: number; // Volume total disponível dessa entrada
  emEstoque: number; // Estoque físico ativo
  valorAquisicao: number;
  valorVenda: number;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "produtos";

// Retorna todas as ampolas em estoque via Snapshot
export const subscribeEstoque = (onData: (data: ProdutoTirzepatida[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items: ProdutoTirzepatida[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ProdutoTirzepatida);
    });
    onData(items);
  }, (error) => {
    console.error("Erro no realtime de estoque:", error);
  });
};

// Mantido apenas para usos ad-hoc se necessário
export const getEstoque = async (): Promise<ProdutoTirzepatida[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const items: ProdutoTirzepatida[] = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() } as ProdutoTirzepatida);
  });
  return items;
};

// Adiciona nova entrada de lote/ampola
export const addProduto = async (produto: Omit<ProdutoTirzepatida, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(newDocRef, {
    ...produto,
    emEstoque: produto.quantidade, // Inicia o ativo de estoque igual à quantidade que entrou
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newDocRef.id;
};

// Atualiza dados de uma ampola ou dá baixa
export const updateProduto = async (id: string, updateData: Partial<ProdutoTirzepatida>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

// Remove do sistema (cuidado com quebra de BI, o ideal é inativar ou ter emEstoque=0)
export const deleteProduto = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
