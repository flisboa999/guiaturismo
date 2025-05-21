
// 1. Inicializar o cliente de Funções da Firebase
// ---------------------------------------------
// Para poder executar nossa função em nuvem (cloud function), precisamos referenciar 
// O serviço de funções da Firebase
// `firebase.functions()` é utilizada para a SDK Firebase versão 8 (compat library).
// Se estiver usando a Firebase SDK versão 9 ou mais nova (modular), deve-se usar:
// import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(); // Instancia da Firebase Functions - versão 1

/*
const functions = firebase.functions(); // Instancia da Firebase Functions - versão 2 - validar qual funciona
*/

// 2. Referência aos elementos HTML
// ---------------------------------------
// Para interagir com os elementos definidos em `index.html`.

// `promptInputElement`: <input type="text" id="prompt-input">
// Onde o usuário escreve o seu prompt.
const promptInputElement = document.getElementById('prompt-input');

// `sendButton`: <button id="send-button">
// Onde o usuário clica para enviar a mensagem.
const sendButton = document.getElementById('send-button');

// `chatLog`: <div id="chat-log">
// Onde todas as mensagems do usuário e do Gemini são exibidas.
const chatLog = document.getElementById('chat-log');

// 3. Monitorar eventos (event listeners)
// ---------------------------
// O chat precisa ser interativo. Isso envolve:
// - Monitorar os cliques no botão "Enviar"
// - Monitorar quando a tecla "Enter" é apertada no campo de texto.

// Quando o botão `sendButton` é clicado, chama a função `sendMessageToGemini` function.
sendButton.addEventListener('click', sendMessageToGemini);

// Quando uma tecla é apertada enquanto o elemento `promptInputElement` está focado:
promptInputElement.addEventListener('keypress', function(event) {
    // Checar se a tecla apertada foi "Enter".
    if (event.key === 'Enter') {
        // A função `sendMessageToGemini` também pode ser ativada apertando Enter.
        sendMessageToGemini();
    }
});

// 4. Definir a funcionalidade central para enviar a mensagem e lidar com a resposta
// -------------------------------------------------------------------
// `sendMessageToGemini` é uma função assíncrona (async) porque vai aguardar a resposta da
// função em nuvem (Cloud function) da Firebase, que em sequência aguarda a resposta da API da Gemini
async function sendMessageToGemini() {
    // 4a. Receber a mensagem do usuário e fazer validação básica
    // ----------------------------------------------------
    // Pegar o texto do `promptInputElement` e aplicar a função `trim()`
    // para remover espaços em branco do início e fim da string
    const userMessage = promptInputElement.value.trim();

    // Se a mensagem estiver vazia após o trim, não faça mais nada
    if (!userMessage) {
        // Mensagem de erro em pop up para o usuário:
        alert("Erro. Por favor digite uma mensagem");
        return; // Parar a execução da função antes do término 
    }

    // 4b. Atualizar a UI (interface do usuário) - Exibir a mensagem do usuário e desabilitar os inputs (entradas)
    // -------------------------------------------------------
    // Exibe a mensagem do usuário diretamente no chat log
    appendMessage('Você', userMessage); // 'Você' means 'You' in Portuguese

    // Limpar o campo de input , uma vez que a mensagem foi enviada (ao chat log).
    promptInputElement.value = '';

    // Desabilitar o o campo de entrada (input) para previnir diversas requisições de envios (flood)
    // enquanto aguarda por uma resposta do Gemini.
    promptInputElement.disabled = true;
    sendButton.disabled = true;

    // Exibir uma mensagem enquanto gemini está processando
    appendMessage('Gemini', 'Pensando...'); // 'Pensando...' means 'Thinking...'

    // 4c. Chamar a Função Cloud da Firebase
    // -----------------------------------
    try {
        // Deve-se referenciar a função 'sendMessage' na Cloud da Firebase para poder chamá-la.
        // Este nome deve ser exatamente o mesmo que foi exportado no backend da Firebase
        // (Exemplo: `exports.sendMessage = functions.https.onCall(...)`).
        const callSendMessage = functions.httpsCallable('sendMessage');

        // Agora chama a função. O argumento é um objeto.
        // O backend da Firebase vai receber esse objeto como o seu parâmetro `data`.
        // Nos estamos enviando a msg do usário `userMessage` na key `prompt`, 
        // então no backend ele será acessível como `data.prompt`.
        console.log("Enviando para a função Firebase:", { prompt: userMessage });
        const result = await callSendMessage({ prompt: userMessage });
        console.log("Resposta recebida da função Firebase:", result);

        // 4d. Processar e Exibir a resposta do Gemini.
        // ------------------------------------------
        // O objeto `result` de uma função chamável contém a propriedade `data`
        // que contém o objeto retornada pela função cloud
        // No backend, nós retornamos `{ reply: geminiOutput }`.
        // Então, referenciando `result.data.reply` pode-se acessar a resposta de texto do Gemini
        updateLastGeminiMessage(result.data.reply);

    } catch (error) {
        // 4e. Lidando com erros
        // -----------------
        // Se algo der errado durante a execução de `callSendMessage`  (ex., problema na conexão,
        // erro levantado pela Cloud Function, Erro da API do Gemini ), vai ser detectado aqui.
        console.error("Erro ao chamar a função Firebase sendMessage:", error);

        // Exibe uma mensagem de erro no chat log.
        // `error.message` geralmente contém uma mensagem amigável ao usuário originada de HttpsError.
        updateLastGeminiMessage('Erro: ' + error.message);

    } finally {
        // 4f. Reativar os inputs
        // ------------------------------
        // O bloco `finally` executa independente se o bloco `try` obteve êxito na sua execução
        // ou se deu um erro. Esta parte reativa a interface do usuário.
        promptInputElement.disabled = false;
        sendButton.disabled = false;

        // Coloca o cursor de volta no campo de entrada
        promptInputElement.focus();
    }
}

// 5. Função para adicionar (Append) mensagens ao chat log
// ----------------------------------------------------------
// Essa função recebe dois argumentos: quem enviou (ex., "Você", "Gemini") e a mensagem (string)
// Cria um novo `div`, aplica estilo e adiciona ao chatlog `chatLog`.
function appendMessage(sender, message) {
    // Cria um novo elemento div para armazenar a mensagem
    const messageElement = document.createElement('div');

    // Adiciona uma classe CSS para personalizar aparência (definida no `style.css`).
    messageElement.classList.add('message');

    // Ajustar o conteúdo do elemento da mensagem.
    // Usa-se `innerHTML` para permitir HTML simples como `<strong>`.
    // `<strong>${sender}:</strong>` faz o nome do 'sender' (quem enviou) ficar negrito.
    // `message.replace(/\n/g, '<br>')` Converte caracteres de nova linha (\n) do Gemini
    // em quebras de linha HTML (<br>) para serem renderizados corretamente.
    // IMPORTANTE: Cuidado com `innerHTML` se o conteúdo de 'message' pode vir de
    // fontes não confiáveis diretamente sem sanitizar as entradas, porque pode ser um vetor para XSS
    // Nesse caso, `sender` é controlado por nós e a `message` do Gemini é geralmente
    // texto, porém se puder conter HTML é provável a necessidade futura de implementar mais sanitização
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message.replace(/\n/g, '<br>')}`;

    // Adiciona a nova mensagem criada para o container `chatLog`
    chatLog.appendChild(messageElement);

    // Automaticamente rola o `chatLog` para o fundo, para que a última mensagem fique visivel
    chatLog.scrollTop = chatLog.scrollHeight;
}

// 6. Função para atualizar o texto de "Pensando" para a mensagem de resposta
// ----------------------------------------------------------------
// Substitui "Pensando..." com a mensagem de resposta do Gemini, ou com um erro.
function updateLastGeminiMessage(newMessage) {
    // Pegar todos os elementos com a classe 'message' dentro do `chatLog`.
    const messages = chatLog.getElementsByClassName('message');

    // Checa se existe alguma mensagem no log.
    if (messages.length > 0) {
        // Pega o elemento da última mensagem.
        const lastMessageElement = messages[messages.length - 1];

        // Checagem simples para ver se a últime mensagem é a "Pensando...".
        // Pressupõe que a msg "Pensando..." sempre começa com "<strong>Gemini:</strong>".
        if (lastMessageElement.innerHTML.includes("<strong>Gemini:</strong>")) {
            // Se positivo, atualiza o seu conteúdo com a nova mensagem do Gemini.
            lastMessageElement.innerHTML = `<strong>Gemini:</strong> ${newMessage.replace(/\n/g, '<br>')}`;
        } else {
            // Fallback: If the last message wasn't the expected placeholder (e.g., user typed
            // something very quickly, or some other edge case), then just append the new message
            // as a fresh Gemini message.
            appendMessage('Gemini', newMessage);
        }
    }
    // Ensure the chat log scrolls to the bottom after updating the message.
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Final de script.js