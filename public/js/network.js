// httpsCallable → permite chamar Funções Cloud diretamente do frontend (javascript) via HTTP, de forma segura e autenticada
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// functions → permite chamar Cloud Functions configuradas no Firebase
import { functions } from './firebase-setup.js';

// addDoc → adiciona novos documentos; serverTimestamp → gera timestamp confiável do servidor no Firestore
import { addDoc, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// chatsCollection → referência central à coleção "chats" no Firestore para armazenar mensagens
import { chatsCollection } from './state.js';

//Imports de UI  - funções
import { showLoading, hideLoading, sendSystemMessage } from './ui.js';

import { db } from './firebase-setup.js';
import { collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Função assíncrona para enviar mensagem à Cloud Function do Firebase, aguardando resposta do Gemini
export async function sendMessageToGemini(userMessage, promptInput, sendButton, userName) {

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
            userAgent: navigator.userAgent, // Captura informações do navegador do usuário (para logging ou análise)
            userName: userName
        };

        console.log("[NET][INIT] Payload criado :", payload , "| typeof:", typeof payload);

        // Obtém uma referência para a função em nuvem chamada 'sendMessage'
        const callSendMessage = httpsCallable(functions, 'sendMessage');

        console.log("[NET][INIT] Variável callSendMessage declarada , executa httpsCallable");

        console.log("[NET][INIT] Iniciando variável result para aguardar resposta");

        // Executa a chamada assíncrona à função do backend, passando o payload
        const result = await callSendMessage(payload);

        if (!result) {

            console.error("[NET][ERROR] Nãp conseguiu obter result: ", result, "| typeof:", typeof result);
    return;
}

        console.log("[NET][RETURN] Resposta recebida (result): ", result ,"| typeof:", typeof result);


    } catch (error) {
        // Captura erros: problemas de rede, falhas no backend ou erros da API do Gemini
        console.error("[NET][ERROR] Erro ao chamar a função Firebase sendMessage: ", error);

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
export async function sendMessageChat(userMessage, promptInput, sendButton, userName) {

    console.log("[NET][CALL] sendMessageChat foi chamada");

    console.log("[NET][UPDATE]] preparando para desabilitar promptInput e sendButton");


    promptInput.disabled = true;
    sendButton.disabled = true;

    console.log("[NET][UPDATE]] promptInput e sendButton desabilitados");

    showLoading();  // Mostra loading

    console.log("[NET][CALL]] Função showLoading() chamada");


    console.log("[NET][INIT]] iniciando bloco try para executar addDoc com chatsCollection como parametro");

    try {
        await addDoc(chatsCollection, {  
            prompt: userMessage,                // Armazena o texto enviado pelo usuário
            response: null,                // Define como null → pois não há resposta automática (não passou pelo Gemini)
            sessionId: crypto.randomUUID(), // Gera um ID de sessão seguro e único via Web Crypto API
            timestamp: serverTimestamp(),    // Timestamp gerado pelo servidor → evita inconsistência com o relógio do cliente
            userAgent: navigator.userAgent, // Registra informações sobre o dispositivo/navegador do usuário
            userName: userName
        });

        console.log("[NET][SUCCESS] Mensagem enviada com sucesso para Firestore."); 
        // Log de sucesso → facilita monitoramento e debugging

    } catch (error) {
        console.error("[NET][ERROR] Falha ao enviar mensagem no chat:", error); 
        // Log de erro técnico para desenvolvedor

        alert("Erro ao enviar a mensagem. Por favor, tente novamente.");  
        // Feedback visual para o usuário → melhora a experiência em caso de falha
    } finally {


        console.log("[NET][UPDATE]] preparando para ativar novamente promptInput e sendButton");

        promptInput.disabled = false;   // Reativa o input → permite nova interação do usuário
        sendButton.disabled = false;    // Reativa o botão → pronto para novos envios

        console.log("[NET][UPDATE]] promptInput e sendButton reativados");

        hideLoading(); // Oculta o indicador de loading → operação concluída

        console.log("[NET][CALL]] Função hideLoading() chamada");

        promptInput.focus(); // Foco automático no input → melhora a experiência e agilidade do usuário
}
}

// editMessage → atualiza o conteúdo de uma mensagem específica no Firestore com o novo texto
export async function editMessage(messageId, newText) {

    const messageRef = doc(db, 'chats', messageId);  
    // Cria uma referência direta ao documento no Firestore com base no ID

    await updateDoc(messageRef, { text: newText });  
    // Atualiza o campo 'text' do documento com o novo conteúdo de forma assíncrona

    console.log('Mensagem editada');  
    // Log de confirmação para debugging

    location.reload();  
    // Força recarregamento da página para refletir a mudança de forma rápida e simplificada
    
}

// nukeDatabase → deleta todos documentos da coleção 'chats' no Firestore
export async function nukeDatabase() {
    console.log("[NET][CALL] Função nukeDatabase chamada");

    const confirmNuke = confirm("Tem certeza? Vai apagar TUDO!");
    console.log("[NET][INIT] confirmNuke:", confirmNuke, "| typeof:", typeof confirmNuke);

    if (confirmNuke) {
        console.log("[NET][CHECK] Usuário confirmou a exclusão em massa");

        const messagesCollection = collection(db, 'chats');
        console.log("[NET][INIT] messagesCollection:", messagesCollection);

        try {
            const snapshot = await getDocs(messagesCollection);
            console.log("[NET][RETURN] Snapshot de messages recebido:", snapshot);

            snapshot.forEach((document) => {
                console.log("[NET][ITERATE] Deletando doc.id:", document.id);

                deleteDoc(doc(db, 'chats', document.id))
                    .then(() => {
                        console.log("[NET][UPDATE] Documento deletado com sucesso:", document.id);
                    })
                    .catch((deleteError) => {
                        console.error("[NET][ERROR] Erro ao deletar doc.id:", document.id, "| Erro:", deleteError);
                    });
            });

            // Mensagem visual de sistema
            sendSystemMessage("💣 Banco apagado pelo admin.");
        } catch (getError) {
            console.error("[NET][ERROR] Erro ao obter snapshot de messages:", getError);
        }
    } else {
        console.log("[NET][CHECK] Usuário cancelou a exclusão em massa");
    }
}


