
// auth → gerencia autenticação e sessões seguras no Firebase; provider → configura OAuth para login via Google
import { auth, provider } from './firebase-setup.js';

// Importa função para popup de login
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// sendMessageToGemini → integra frontend com API Gemini via Cloud Functions; sendMessageChat → grava mensagens direto no Firestore
import { sendMessageToGemini, sendMessageChat, nukeDatabase } from './network.js';

// chatsCollection → referência central à coleção "chats" no Firestore; initSnapshot → listener reativo para atualização automática da UI
import { chatsCollection, initSnapshot } from './state.js';

// renderMessage → função responsável por criar e inserir dinamicamente elementos de mensagem no chat-log da interface
import { renderMessage, renderAdminControls, updateRenderedMessage, showEditPopup } from './ui.js';

// Referência para interagir e aplicar métodos nos elementos HTML.
// Os ids possuem o mesmo nome das variáveis
// - promptInput: <input type="text" id="prompt-input">
// - sendButton: <button id="send-button">
// - chatLog: <div id="chat-log">

const promptInput = document.getElementById('prompt-input'); // Onde o usuário escreve o seu prompt.
const sendButton = document.getElementById('send-button'); // Onde o usuário clica para enviar a mensagem.
const chatLog = document.getElementById('chat-log'); // Onde todas as mensagems do usuário e do Gemini são exibidas.

console.log("[MAIN][INIT] declarou promptInput, sendButton, chatLog");

initSnapshot(chatsCollection, renderMessage, chatLog);

console.log("[MAIN][CALL] chamou initSnapShot");

// Event listeners → permite chat interativo e responsivo:
// - Click no botão "Enviar" → dispara envio da mensagem
// - Keypress na tecla "Enter" no input → alternativa rápida para enviar

// Quando o botão "Enviar" for clicado → chama handleSendMessage
sendButton.addEventListener('click', handleSendMessage);
// Passamos a função como referência, sem (), para que só execute no evento (execução futura, não imediata)

// Quando uma tecla for pressionada no campo de input...
promptInput.addEventListener('keypress', function(event) {

    // Se a tecla for "Enter" → envia a mensagem
    if (event.key === 'Enter'  && !event.shiftKey) {
        handleSendMessage(); // Aqui usamos () → executa a função imediatamente
    }
});

let userName = '';  // Variável para guardar nome
let userEmail = ''; // Variável para guardar email
let userRole = '';  // Variável para role: admin ou user

console.log("[MAIN][INIT] declarou userName, userEmail, userRole p/ manipular dados do usuário");

//função utilitária pra checar se usuário está logado
function isUserAuthenticated() {
    return !!userEmail;  // Retorna true se userEmail estiver preenchido
}

// Função de autenticação
function authenticateUser() {

    console.log("[MAIN][CALL] chamou authenticateUser");

    console.log("[MAIN][INIT] Preparando para inicializar signInWithPopup");

    signInWithPopup(auth, provider)   // Abre popup do Google para autenticação

        .then((result) => {

            
            console.log("[MAIN][CALL] Executando signInWithPopup");

            console.log("[MAIN][INIT] result : ", result, "| typeof:", typeof result);

            console.log("[MAIN][INIT] Iniciando variável user");
            
            const user = result.user;               // Pega todos dados do usuário
            
            console.log("[MAIN][CHECK] user: ", user, "| typeof:", typeof user);

            userName = user.displayName;            // Atribui Nome à variável declarada anteriormente
            
            console.log("[MAIN][CHECK] userName: ", userName, "| typeof:", typeof userName);

            userEmail = user.email;                 // Atribui email à variável declarada anteriormente

            console.log("[MAIN][INIT] Iniciando userName e userEmail");

            console.log(`[MAIN][CHECK]Logado como: ${userName} (${userEmail})`);  // Log

            defineUserRole(userEmail);              // Define role
        })
        .catch((error) => console.error("[MAIN][ERROR]Erro no login:", error));  // Trata erro
}

// Função para definir se é admin ou user
function defineUserRole(email) {
    console.log("[MAIN][CALL] chamou defineUserRole");

    if (email.toLowerCase() === 'flisboa.tec@gmail.com') {
        userRole = 'admin';
        console.log(`[MAIN][CHECK] O userRole é ${userRole}`);
        renderAdminControls();
    } else {
        userRole = 'user';
        console.log(`[MAIN][CHECK] O userRole é ${userRole}`);
    }
}

onAuthStateChanged(auth, (user) => {  
    // Listener reativo → monitora automaticamente alterações na autenticação do usuário
    // Dispara sempre que: usuário loga, desloga ou muda de status

    if (user) {  
        // Se usuário já está autenticado → mantém sessão ativa sem necessidade de novo login

        console.log(`[MAIN][AUTH] Usuário já logado: ${user.displayName} (${user.email})`);  
        // Loga para rastreamento e conferência rápida

        userName = user.displayName;  

        console.log("[MAIN][CHECK] userName declarado: ", userName, "| typeof:", typeof userName);

        userEmail = user.email;
        // Atualiza variáveis globais com dados do usuário atual

        defineUserRole(userEmail);  
        // Define role (admin/user) com base no email → controla acesso a funções sensíveis
    } else {  
        // Se não há usuário autenticado → inicia fluxo de autenticação

        console.log("[MAIN][AUTH] Nenhum usuário logado. Solicitando autenticação...");  
        // Loga status para facilitar debug de fluxo

        authenticateUser();  
        // Aciona popup de autenticação Google → conecta usuário ao sistema
    }
});

// handleSendMessage - Função que decide o que fazer quando o usuário envia uma mensagem ()
function handleSendMessage() {


    if (!isUserAuthenticated()) {
        alert("Você precisa estar logado para enviar mensagens.");
        console.log("[MAIN][CHECK]Usuário não autenticado → bloqueando envio.");
        return;
    }


    console.log("[MAIN][CALL] handleSendMessage chamada");

    // Pega o texto que o usuário digitou no campo de input
    const userMessage = promptInput.value.trim();  
    console.log("[MAIN][INIT] userMessage capturado:", userMessage, "| typeof:", typeof userMessage);

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
        promptInput.value = '';


    } else {

        console.log("[CALL] Chamando sendMessageChat com argumento:", userMessage);

        // Se não for "gemini", envia a mensagem como chat público
        sendMessageChat(userMessage, promptInput, chatLog);

        promptInput.value = '';

    }
}
