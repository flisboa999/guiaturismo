// Importar as funções necessárias dos SDKs da Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// Documentação de referência para libs disponíveis
// https://firebase.google.com/docs/web/setup#available-libraries


// Importar Funções e Firestore (DB) da Firebase; Ambiente de Produção (Deploy na web) e teste (Emulador local)
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Opcional - auth para implementar autenticação depois
// import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuração do aplicativo Firebase - informações únicas
// A Chave API não é secreta, é uma ID pública de referência ao Aplicativo na lista de apps dos servidores Firebase / Google 
const firebaseConfig = {
    apiKey: "AIzaSyCvlBh7SVIO_BALdf1mVpXlQgLLik1Cxj0",
    authDomain: "guia-turismo-ia.firebaseapp.com",
    projectId: "guia-turismo-ia",
    storageBucket: "guia-turismo-ia.firebasestorage.app",
    messagingSenderId: "463725890721",
    appId: "1:463725890721:web:c2f59f6c611d70b01834e0",
    measurementId: "G-KM5Q55VW3Y"
    };

// Inicializar App Firebase
const app = initializeApp(firebaseConfig);
console.log("Aplicativo Firebase Inicializado (App instanciado)");

// Inicializar Firestore (database)
const db = getFirestore(app);

// Inicializar functions
const functions = getFunctions(app, "us-central1");

// Opcional: Inicializar Auth
// export const auth = getAuth(app);

// Conecta automaticamente no emulador se estiver rodando localmente
if (location.hostname === "localhost") {
    console.log('piu');

    // Emulador Firestore
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("Conectado ao Emulador da Firestore em localhost:8080");

    // Emulador functions
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Conectado ao Emulador Functions Emulator at localhost:5001");

    // Opcional: Emulator de autenticação
    // connectAuthEmulator(auth, "http://localhost:9099");
    // console.log("✅ Connected to Auth Emulator at localhost:9099");

    }

// Inicializar analytics
const analytics = getAnalytics(app);

// Exportar o app,db,functions para usar no script.js
export { app, db, functions };
