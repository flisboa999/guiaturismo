// httpsCallable → permite chamar Funções Cloud diretamente do frontend (javascript) via HTTP, de forma segura e autenticada
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";


// functions → permite chamar Cloud Functions configuradas no Firebase
import { functions } from './firebase-setup.js';

// addDoc → adiciona novos documentos; serverTimestamp → gera timestamp confiável do servidor no Firestore
import { addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// chatsCollection → referência central à coleção "chats" no Firestore para armazenar mensagens
import { chatsCollection } from './state.js';


//hideLoading → mostra o indicador de carregamento na interface
import { showLoading } from './ui.js';

// hideLoading → esconde o indicador de carregamento na interface
import { hideLoading } from './ui.js';


// Função assíncrona para enviar mensagem à Cloud Function do Firebase, aguardando resposta do Gemini
export async function sendMessageToGemini(userMessage, promptInput, sendButton) {

    console.log("[NET][CALL] Função sendMessageToGemini chamada");  //Marca o início da função

    // Valida se a mensagem está vazia ou composta só de espaços
    if (!userMessage) {
        console.log("[NET][CHECK] userMessage vazio ou inválido:", userMessage);

        alert("Erro. Por favor digite uma mensagem");  // Abre janela de erro na tela do usuário.

        return;  // Encerra a execução, pois não faz sentido prosseguir com o input vazio
    }

    console.log("[NET][CHECK] userMessage válido:", userMessage);

    // Limpa o campo de input após capturar a mensagem
    promptInput.value = '';  
    console.log("[NET][UPDATE] promptInput limpo");

    // Desabilita o input e o botão para evitar múltiplos envios simultâneos 
    // Funciona como um mecanismo simples de anti-flood para evitar abusos de múltiplas requisições


    showLoading(); // Mostra o loading
    console.log("[NET][CALL] Função showLoading()");
    
    promptInput.disabled = true;  // desativa campo de prompt
    sendButton.disabled = true; // desativa botão de enviar

    console.log("[NET][UPDATE] promptInput e sendButton desativados");

    try {
        console.log("[NET][INIT] Preparando payload");  

        // Monta o objeto 'payload' contendo os dados necessários para serem enviados ao backend
        const payload = {
            prompt: userMessage,  // Mensagem que será enviada à API do Gemini
            sessionId: "sess-" + crypto.randomUUID(),  // Gera um ID de sessão aleatório para rastreamento
            userAgent: navigator.userAgent  // Captura informações do navegador do usuário (para logging ou análise)
        };

        console.log("[NET][INIT] Payload criado :", payload , "| typeof:", typeof payload);

        // Obtém uma referência para a função em nuvem chamada 'sendMessage'
        const callSendMessage = httpsCallable(functions, 'sendMessage');

        console.log("[NET][CALL] Função Firebase sendMessage preparada");

        // Executa a chamada assíncrona à função do backend, passando o payload
        const result = await callSendMessage(payload);  

        console.log("[NET][RETURN] Resposta recebida da Firebase:", result);

        // (Possível extensão: aqui poderia atualizar a UI com a resposta usando updateLastGeminiMessage)

    } catch (error) {
        // Captura erros: problemas de rede, falhas no backend ou erros da API do Gemini
        console.error("[NET][ERROR] Erro ao chamar a função Firebase sendMessage:", error);

    } finally {
        // Executa sempre: reativa a interface do usuário, permitindo novos envios
        promptInput.disabled = false;  
        sendButton.disabled = false;

        console.log("[NET][UPDATE] promptInput e sendButton reativados");

        hideLoading();

        // Coloca o foco de volta no input para melhorar a experiência do usuário
        promptInput.focus();  

        console.log("[NET][UPDATE] promptInput focado");
    }
}


// Função sendMessageChat → grava uma nova mensagem diretamente na coleção "chats" do Firestore
// Usada para armazenar mensagens públicas enviadas pelo usuário, sem processamento da API Gemini
export async function sendMessageChat(userMessage, promptInput, sendButton) {

    promptInput.disabled = true;
    sendButton.disabled = true;

    showLoading();  // Mostra loading

    try {
        await addDoc(chatsCollection, {  
            prompt: userMessage,                // Armazena o texto enviado pelo usuário
            response: null,                // Define como null → pois não há resposta automática (não passou pelo Gemini)
            sessionId: crypto.randomUUID(), // Gera um ID de sessão seguro e único via Web Crypto API
            timestamp: serverTimestamp(),    // Timestamp gerado pelo servidor → evita inconsistência com o relógio do cliente
            userAgent: navigator.userAgent, // Registra informações sobre o dispositivo/navegador do usuário
        });

        console.log("[SUCCESS] Mensagem enviada com sucesso para Firestore."); 
        // Log de sucesso → facilita monitoramento e debugging

    } catch (error) {
        console.error("[ERROR] Falha ao enviar mensagem no chat:", error); 
        // Log de erro técnico para desenvolvedor

        alert("Erro ao enviar a mensagem. Por favor, tente novamente.");  
        // Feedback visual para o usuário → melhora a experiência em caso de falha
    } finally {

        promptInput.disabled = false;   // Reativa o input → permite nova interação do usuário
        sendButton.disabled = false;    // Reativa o botão → pronto para novos envios
        hideLoading();                  // Oculta o indicador de loading → operação concluída
        promptInput.focus();            // Foco automático no input → melhora a experiência e agilidade do usuário
}
}