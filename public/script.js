// httpsCallable → permite chamar Funções Cloud diretamente do frontend (javascript) via HTTP, de forma segura e autenticada
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

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
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Referência à coleção "chats" no Firestore, onde as mensagens serão criadas, lidas e monitoradas em tempo real
const chatsCollection = collection(db, "chats");

// onSnapshot → Cria listener reativo em "chats" para sincronizar a Interface (UI) em tempo real as coleções do banco de dados Firebase
// Snapshot → Cópia fiel e instantânea dos dados no momento da mudança (create, update, delete), aciona automático no acionamento da consulta ou do listener
// Dispara automaticamente sempre que um novo documento (mensagem) é adicionado
// Cria um listener em tempo real na coleção "chats" (Listener: "ouve" alterações em tempo real)
onSnapshot(chatsCollection, (snapshot) => {
    
    // Itera sobre as mudanças detectadas, evitando processar o snapshot completo desnecessariamente
    snapshot.docChanges().forEach((change) => {

        // Se a mudança for "added" → novo documento criado; ignora updates e deletes para otimizar a renderização
        if (change.type === "added") {

            // Chama renderMessage para inserir a nova mensagem na UI de forma dinâmica e incremental
            // Passa: 1) ID único do doc (para rastreamento e manipulação futura); 2) dados da mensagem
            renderMessage(change.doc.id, change.doc.data());
        }
    });
});

// Função que recebe: 
// - docId → ID do documento no Firestore.
// - data → dados da mensagem (prompt, response, etc.).
function renderMessage(docId, data) {

    console.log("[CALL] renderMessage docId:", docId, "| typeof:", typeof docId);
    console.log("[CALL] renderMessage data:", data, "| typeof:", typeof data);

    // Cria um novo elemento HTML <div> para exibir a mensagem.
    const messageElement = document.createElement('div');

    console.log("[INIT] messageElement criado:", messageElement, "| typeof:", typeof messageElement);

    // Adiciona a classe CSS 'message' para estilizar esse div.
    messageElement.classList.add('message');

    console.log("[UPDATE] Classe 'message' adicionada ao messageElement");

    // Cria a variável content que vai conter o texto formatado da mensagem.
    let content = `<strong>Usuário:</strong> ${data.prompt}`;

    console.log("[INIT] content criado com prompt:", content, "| typeof:", typeof content);

    // Se a mensagem tem uma resposta (ou seja, não é null ou undefined):
    if (data.response) {

        console.log("[CHECK] data.response existe:", data.response, "| typeof:", typeof data.response);

        // Adiciona uma nova linha com a resposta do Gemini.
        content += `<br><strong>Gemini:</strong> ${data.response}`;

        console.log("[UPDATE] content atualizado com response:", content);

    } else {
        console.log("[CHECK] data.response não existe ");
    }

    // Define o conteúdo HTML da div como o texto formatado.
    messageElement.innerHTML = content;
    console.log("[UPDATE] messageElement.innerHTML definido:", messageElement.innerHTML);

    // Adiciona (append) a nova div com a mensagem ao final do chatLog.
    chatLog.appendChild(messageElement);

    console.log("[UPDATE] messageElement adicionado ao chatLog");

    // Faz o scroll automático do chat para mostrar a última mensagem.
    chatLog.scrollTop = chatLog.scrollHeight;
    
    console.log("[UPDATE] chatLog scrolado para o final. scrollTop:", chatLog.scrollTop);
}

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
    const messageType = document.getElementById(message-type).value;

    console.log("[CHECK] messageType selecionado:", messageType);

    // Se o usuário escolheu "gemini"
    if (messageType === 'gemini') {

        console.log("[CALL] Chamando sendMessageToGemini com argumento:", userMessage);

        // Chama a função que envia a mensagem para o Gemini (IA)
        sendMessageToGemini(userMessage);

    } else {

        console.log("[CALL] Chamando sendMessageChat com argumento:", userMessage);

        // Se não for "gemini", envia a mensagem como chat público
        sendMessageChat(userMessage);
    }
}

// Função assíncrona para enviar mensagem à Cloud Function do Firebase, aguardando resposta do Gemini
async function sendMessageToGemini(userMessage) {

    console.log("[CALL] Função sendMessageToGemini chamada");  //Marca o início da função

    // Obtém o valor atual do campo de input e remove espaços extras (início e fim) com método .trim()
    const userMessage = promptInput.value.trim();

    console.log("[INIT] userMessage:", userMessage, "| typeof:", typeof userMessage);

    // Valida se a mensagem está vazia ou composta só de espaços
    if (!userMessage) {
        console.log("[CHECK] userMessage vazio ou inválido:", userMessage);

        alert("Erro. Por favor digite uma mensagem");  // Abre janela de erro na tela do usuário.

        return;  // Encerra a execução, pois não faz sentido prosseguir com o input vazio
    }

    console.log("[CHECK] userMessage válido:", userMessage);

    // Limpa o campo de input após capturar a mensagem
    promptInput.value = '';  
    console.log("[UPDATE] promptInput limpo");

    // Desabilita o input e o botão para evitar múltiplos envios simultâneos 
    // Funciona como um mecanismo simples de anti-flood para evitar abusos de múltiplas requisições
    promptInput.disabled = true;  
    sendButton.disabled = true;
    
    console.log("[UPDATE] promptInput e sendButton desativados");

    try {
        console.log("[INIT] Preparando payload");  

        // Monta o objeto 'payload' contendo os dados necessários para serem enviados ao backend
        const payload = {
            prompt: userMessage,  // Mensagem que será enviada à API do Gemini
            sessionId: "sess-" + Math.random().toString(36).substring(2, 8),  // Gera um ID de sessão aleatório para rastreamento
            userAgent: navigator.userAgent  // Captura informações do navegador do usuário (para logging ou análise)
        };

        console.log("[INIT] Payload criado:", payload);

        // Obtém uma referência para a função em nuvem chamada 'sendMessage'
        const callSendMessage = httpsCallable(functions, 'sendMessage');

        console.log("[CALL] Função Firebase sendMessage preparada");

        // Executa a chamada assíncrona à função do backend, passando o payload
        const result = await callSendMessage(payload);  

        console.log("[RETURN] Resposta recebida da Firebase:", result);

        // (Possível extensão: aqui poderia atualizar a UI com a resposta usando updateLastGeminiMessage)

    } catch (error) {
        // Captura erros: problemas de rede, falhas no backend ou erros da API do Gemini
        console.error("[ERROR] Erro ao chamar a função Firebase sendMessage:", error);

    } finally {
        // Executa sempre: reativa a interface do usuário, permitindo novos envios
        promptInput.disabled = false;  
        sendButton.disabled = false;

        console.log("[UPDATE] promptInput e sendButton reativados");

        // Coloca o foco de volta no input para melhorar a experiência do usuário
        promptInput.focus();  

        console.log("[UPDATE] promptInput focado");
    }
}

// Função sendMessageChat → grava mensagem diretamente na coleção "chats" do Firestore, sem passar pela API Gemini
// Usada para enviar mensagens públicas no chat global, armazenando os dados direto do frontend
// Armazena: prompt, response (null), ID de sessão aleatório e userAgent do cliente

async function sendMessageChat(prompt) {
    await addDoc(chatsCollection, {
        prompt: prompt,  // Mensagem enviada pelo usuário
        response: null,  // Nenhuma resposta, pois não passou pelo Gemini
        sessionId: "sess-" + Math.random().toString(36).substring(2, 8),  // ID de sessão aleatório
        userAgent: navigator.userAgent,  // Info do cliente
        timestamp: serverTimestamp()  // Timestamp confiável do servidor
    });
}
// Final de script.js