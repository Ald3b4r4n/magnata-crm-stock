import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAuBYh8T1clPTuXijnRenE6RFi2hsdY4P0",
  authDomain: "magnata-crm-stock.firebaseapp.com",
  projectId: "magnata-crm-stock",
  storageBucket: "magnata-crm-stock.firebasestorage.app",
  messagingSenderId: "1036471520896",
  appId: "1:1036471520896:web:84fde94a53b1c9764d2065"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

createUserWithEmailAndPassword(auth, "gestor@magnata.com.br", "Magnata@2026")
  .then(() => {
    console.log("Sucesso: Usuario 'gestor@magnata.com.br' criado.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erro ao criar:", err.message);
    process.exit(1);
  });
