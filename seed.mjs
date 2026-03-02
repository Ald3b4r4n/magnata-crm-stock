import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import fs from "fs";

// Leitura manual do env local para evitar necessitar da biblioteca dotenv
const envConfig = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

const firebaseConfig = {
  apiKey: envVars['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: envVars['NEXT_PUBLIC_FIREBASE_APP_ID']
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("⏳ Sincronizando coleções e enviando documento inicial de configuração...");
  try {
    const docRef1 = await addDoc(collection(db, "produtos"), {
      marca: "Mounjaro",
      volume: "10mg",
      lote: "LOTE-INICIAL",
      quantidade: 10,
      valorAquisicao: 1000,
      valorVenda: 2500,
      emEstoque: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("✅ Coleção 'produtos' criada! Lote INICIAL inserido.");

    const docRef2 = await addDoc(collection(db, "clientes"), {
        nome: "Magnata Admin (Primeiro Cadastro)",
        telefone: "5511999999999",
        loteComprado: "LOTE-INICIAL",
        volume: "10mg",
        quantidade: 1,
        valorTotal: 2500,
        statusPagamento: "Pago",
        dataCompra: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    console.log("✅ Coleção 'clientes' criada! Cliente INICIAL inserido.");

    console.log("🚀 Tudo pronto! Você pode apagar esses dados pela UI do sistema a qualquer momento.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Erro ao sincronizar as coleções: ", e);
    process.exit(1);
  }
}

seed();
