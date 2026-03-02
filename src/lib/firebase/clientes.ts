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

export interface Cliente {
  id?: string;
  nome: string;
  telefone: string; 
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "clientes";

export const subscribeClientes = (onData: (data: Cliente[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("nome", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items: Cliente[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as Cliente);
    });
    onData(items);
  }, (error) => {
    console.error("Erro no realtime de clientes:", error);
  });
};

export const getClientes = async (): Promise<Cliente[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("nome", "asc"));
  const querySnapshot = await getDocs(q);
  const items: Cliente[] = [];
  querySnapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() } as Cliente);
  });
  return items;
};

export const addCliente = async (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newDocRef = doc(collection(db, COLLECTION_NAME));
  await setDoc(newDocRef, {
    ...cliente,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newDocRef.id;
};

export const updateCliente = async (id: string, updateData: Partial<Cliente>) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp()
  });
};

export const deleteCliente = async (id: string, cascadeData?: boolean) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
  // Opcionalmente: Deletar histórico de vendas / compras (não faremos agora por integridade do BI de faturamento).
};
