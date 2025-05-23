// Importar as funções necessárias dos SDKs da Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// Documentação de referência para libs disponíveis
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Inicializar analytics
const analytics = getAnalytics(app);

// Exportar o app para usar no script.js
export { app };