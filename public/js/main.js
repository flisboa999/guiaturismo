// Configuraçao Firebase : 
// app → Instância do aplicativo Firebase
// db → Instância do Firestore (banco de dados)
// functions → Instância das Cloud Functions
import { app, db, functions } from './firebase-setup.js';

// Firestore:
// collection → cria ou referencia uma coleção, ponto de entrada para operações CRUD (Create,Read,Update,Delete)
// addDoc → insere um novo documento automaticamente com ID único
// serverTimestamp → gera timestamp confiável do servidor, evitando dependência do relógio do cliente
// onSnapshot → listener reativo que detecta e responde a mudanças (create, update, delete) em tempo real
// query, orderBy → cria consultas complexas e ordena resultados de forma eficiente

import { collection, addDoc, serverTimestamp, } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// auth → gerencia autenticação e sessões seguras no Firebase; provider → configura OAuth para login via Google
import { auth, provider } from './firebase-setup.js';

// sendMessageToGemini → integra frontend com API Gemini via Cloud Functions; sendMessageChat → grava mensagens direto no Firestore
import { sendMessageToGemini, sendMessageChat } from './network.js';

// chatsCollection → referência central à coleção "chats" no Firestore; initSnapshot → listener reativo para atualização automática da UI
import { chatsCollection, initSnapshot } from './state.js';

// renderMessage → função responsável por criar e inserir dinamicamente elementos de mensagem no chat-log da interface
import { renderMessage } from './ui.js';


// Função de timestamp: Simples, facilita o debug e armazenamento de logs
function timestamp() {
  return `[${new Date().toLocaleString()}]`;
}

// Referência para interagir e aplicar métodos nos elementos HTML.
// Os ids possuem o mesmo nome das variáveis
// - promptInput: <input type="text" id="prompt-input">
// - sendButton: <button id="send-button">
// - chatLog: <div id="chat-log">

const promptInput = document.getElementById('prompt-input'); // Onde o usuário escreve o seu prompt.
const sendButton = document.getElementById('send-button'); // Onde o usuário clica para enviar a mensagem.
const chatLog = document.getElementById('chat-log'); // Onde todas as mensagems do usuário e do Gemini são exibidas.

initSnapshot(chatsCollection, renderMessage, chatLog);
console.log("[CALL] initSnapShot");

// Event listeners → permite chat interativo e responsivo:
// - Click no botão "Enviar" → dispara envio da mensagem
// - Keypress na tecla "Enter" no input → alternativa rápida para enviar

// Quando o botão "Enviar" for clicado → chama handleSendMessage
sendButton.addEventListener('click', handleSendMessage);
// Passamos a função como referência, sem (), para que só execute no evento (execução futura, não imediata)

// Quando uma tecla for pressionada no campo de input...
promptInput.addEventListener('keypress', function(event) {

    // Se a tecla for "Enter" → envia a mensagem
    if (event.key === 'Enter') {
        handleSendMessage(); // Aqui usamos () → executa a função imediatamente
    }
});



// Importa função para popup de login
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let userName = '';  // Variável para guardar nome
let userEmail = ''; // Variável para guardar email
let userRole = '';  // Variável para role: admin ou user

// Função de autenticação
function authenticateUser() {
    signInWithPopup(auth, provider)   // Abre popup do Google para autenticação
        .then((result) => {
            const user = result.user;               // Pega dados do usuário
            userName = user.displayName;            // Nome
            userEmail = user.email;                 // Email

            console.log(`Logado como: ${userName} (${userEmail})`);  // Log

            defineUserRole(userEmail);              // Define role
        })
        .catch((error) => console.error("Erro no login:", error));  // Trata erro
}



// Função para definir se é admin ou user
function defineUserRole(email) {
    if (email === 'admin@seusite.com') {  // Se for admin
        userRole = 'admin';
        console.log('Usuário é ADMIN');
        renderAdminControls();            // Renderiza botões admin
    } else {                             // Senão
        userRole = 'user';
        console.log('Usuário comum');
    }
}

// Chama autenticação ao carregar o app
authenticateUser();



// login → inicia fluxo de autenticação via popup, usando o provedor Google
function login() {
    signInWithPopup(auth, provider) // Abre popup de login Google e conecta ao Firebase Auth
        .then(result => {
            const user = result.user; // Extrai objeto do usuário autenticado
            console.log("[AUTH] Usuário logado:", user.email); // Loga e-mail para debug e conferência
            checkAdmin(user); // Após login, verifica se usuário é admin e executa lógica condicional
        })
        .catch(error => console.error("[AUTH ERROR]", error)); // Captura e exibe qualquer erro de autenticação
}



// handleSendMessage - Função que decide o que fazer quando o usuário envia uma mensagem ()
function handleSendMessage() {

    console.log("[CALL] handleSendMessage chamada");

    // Pega o texto que o usuário digitou no campo de input
    const userMessage = promptInput.value.trim();  
    console.log("[INIT] userMessage capturado:", userMessage, "| typeof:", typeof userMessage);

    // Se a mensagem estiver vazia...
    if (!userMessage) {  

        console.log("[CHECK] userMessage está vazia ou inválida:", userMessage);

        // Mostra um alerta avisando que precisa digitar algo
        alert("Erro. Por favor digite uma mensagem");

        console.log("[UPDATE] Alerta de erro exibido para o usuário");

        // Para a função aqui mesmo
        return;  
    }

    console.log("[CHECK] userMessage válida:", userMessage);


    // Referência à tag HTML <select>):
    // <select id="message-type">; value="chat" ou "gemini"

    const messageTypeSelector = document.getElementById('message-type');
    const messageType = messageTypeSelector.value;

    console.log("[CHECK] messageType selecionado:", messageType);

    // Se o usuário escolheu "gemini"
    if (messageType === 'gemini') {

        console.log("[CALL] Chamando sendMessageToGemini com argumento:", userMessage);

        // Chama a função que envia a mensagem para o Gemini (IA)
        sendMessageToGemini(userMessage, promptInput, chatLog);

    } else {

        console.log("[CALL] Chamando sendMessageChat com argumento:", userMessage);

        // Se não for "gemini", envia a mensagem como chat público
        sendMessageChat(userMessage, promptInput, chatLog);
    }
}
