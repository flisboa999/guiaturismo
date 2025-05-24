// 1. Inicializar o cliente de Funções da Firebase
// ---------------------------------------------
// Para poder executar nossa função em nuvem (cloud function), precisamos importar diversos
// módulos diretamente da CDN (Content Distribution Network) da Firebase
// Imports das Funções em Nuvem (Cloud Functions)
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
// Imports de banco de dados Firestore e timestamp
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
import { app, db, functions } from './firebase-setup.js';// Importa oS objetos do app, db,functions Firebase, instanciados no arquivo firebase-setup


const db = getFirestore(app); // Instancia banco de dados Firestore
//Utilizada para todos reads/writes (leituras/gravações) no Banco de Dados

// Conectar ao emulador da Firestore
const isLocal = location.hostname === "localhost"; 

if (isLocal) {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Conectador");
}


// 2. Referência aos elementos HTML
// ---------------------------------------
// Para interagir com os elementos definidos em `index.html`.



// `promptInputElement`: <input type="text" id="prompt-input">
// `sendButton`: <button id="send-button">
// `chatLog`: <div id="chat-log">

const promptInputElement = document.getElementById('prompt-input'); // Onde o usuário escreve o seu prompt.
const sendButton = document.getElementById('send-button'); // Onde o usuário clica para enviar a mensagem.
const chatLog = document.getElementById('chat-log'); // Onde todas as mensagems do usuário e do Gemini são exibidas.
const messageType = messageTypeSelector.value; // Escolhe se vai mandar pelo Gemini ou mensagem normal no Chat público
const chatsCollection = collection(db, "chats"); //


//0. OnSnapshot - Função que sincroniza em tempo real com as coleções do banco de dados da Firestore
// Sempre que for adicionado um novo documento (mensagem) -> função é chamada automaticamente



// Cria um listener em tempo real na coleção "chats"
onSnapshot(chatsCollection, (snapshot) => {
    
    // Para cada alteração que aconteceu no snapshot (adicionar, modificar ou deletar)
    snapshot.docChanges().forEach((change) => {
        
        // Se a alteração for do tipo "added" (ou seja, uma nova mensagem foi inserida)
        if (change.type === "added") {
            
            // Chama a função renderMessage para exibir essa nova mensagem na interface.
            // Passa o ID do documento e os dados da mensagem.
            renderMessage(change.doc.id, change.doc.data());
        }
    });
});


// Função que recebe: 
// 1. docId → ID do documento no Firestore.
// 2. data → dados da mensagem (prompt, response, etc.).
function renderMessage(docId, data) {

    // Cria um novo elemento HTML <div> para exibir a mensagem.
    const messageElement = document.createElement('div');

    // Adiciona a classe CSS 'message' para estilizar esse div.
    messageElement.classList.add('message');

    // Cria a variável content que vai conter o texto formatado da mensagem.
    // Sempre começa mostrando o prompt enviado pelo usuário.
    let content = `<strong>Usuário:</strong> ${data.prompt}`;

    // Se a mensagem tem uma resposta (ou seja, não é null ou undefined):
    if (data.response) {
        
        // Adiciona uma nova linha com a resposta do Gemini.
        content += `<br><strong>Gemini:</strong> ${data.response}`;
    }

    // Define o conteúdo HTML da div como o texto formatado.
    messageElement.innerHTML = content;

    // Adiciona (append) a nova div com a mensagem ao final do chatLog.
    chatLog.appendChild(messageElement);

    // Faz o scroll automático do chat para mostrar a última mensagem.
    chatLog.scrollTop = chatLog.scrollHeight;
}



// 3. Monitorar eventos (event listeners)
// ---------------------------
// O chat precisa ser interativo. Isso envolve:
// - Monitorar os cliques no botão "Enviar"
// - Monitorar quando a tecla "Enter" é apertada no campo de texto.


// Função que vai decidir o que fazer quando o usuário enviar uma mensagem
function handleSendMessage() {
    
    // Pega o texto que o usuário digitou no campo de input
    const userMessage = promptInputElement.value.trim();  
    // `.trim()` remove espaços no começo e no fim da mensagem

    // Se a mensagem estiver vazia...
    if (!userMessage) {  
        // Mostra um alerta avisando que precisa digitar algo
        alert("Erro. Por favor digite uma mensagem");
        // Para a função aqui mesmo
        return;  
    }

    // Pega qual opção o usuário escolheu: "chat" ou "gemini" 
    // Se o usuário escolheu "gemini"
    if (messageType === 'gemini') {
        // Chama a função que envia a mensagem para o Gemini (IA)
        sendMessageToGemini(userMessage);
    } else {
        // Se não for "gemini", envia a mensagem como chat público
        sendMessageChat(userMessage);
    }
}


// Quando o botão de enviar for clicado
sendButton.addEventListener('click', handleSendMessage);
// Passamos a função como referência, sem os parênteses ().
// Assim, ela só será executada quando o usuário clicar.


// Quando qualquer tecla for pressionada dentro do campo de input
promptInputElement.addEventListener('keypress', function(event) {
    
    // Se a tecla pressionada for "Enter"...
    if (event.key === 'Enter') {
        // Chama a função para enviar a mensagem
        handleSendMessage();
        // Aqui usamos () porque queremos que a função execute AGORA.
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

    console.log("Declarou variavel userMessage");
    console.log("Printando userMessage: ", userMessage);
    console.log("Printando typeof userMessage: ", (typeof userMessage));

    // Se a mensagem estiver vazia após o trim, não faça mais nada
    if (!userMessage) {
        // Mensagem de erro em pop up para o usuário:
        alert("Erro. Por favor digite uma mensagem");
        return; // Parar a execução da função antes do término
    }

    // 4b. Atualizar a UI (interface do usuário) - Exibir a mensagem do usuário e desabilitar os inputs (entradas)
    // -------------------------------------------------------
    // Adiciona (append) a mensagem do usuário diretamente no chat log
    appendMessage('Você', userMessage); //

    // Limpar o campo de input , uma vez que a mensagem foi enviada (ao chat log).
    promptInputElement.value = '';

    // Desabilitar o o campo de entrada (input) para previnir abusos com diversas requisições de envios (flood)
    // enquanto aguarda por uma resposta do Gemini.
    promptInputElement.disabled = true;
    sendButton.disabled = true;

    // Exibir uma mensagem enquanto gemini está processando
    appendMessage('Gemini', 'Pensando...');

    // 4c. Chamar a Função Cloud da Firebase
    // -----------------------------------
    try {
        // Deve-se referenciar a função 'sendMessage' na Cloud da Firebase para poder chamá-la.
        // Este nome deve ser exatamente o mesmo que foi exportado no backend da Firebase
        // (Exemplo: `exports.sendMessage = functions.https.onCall(...)`).

        console.log("Payload que estou enviando: ", { prompt: userMessage });
        console.log("Console.log do userAgent: ", navigator.userAgent); // teste user agent

        const callSendMessage = httpsCallable(functions, 'sendMessage');

        // Agora chama a função. O argumento é um objeto.
        // O backend da Firebase vai receber esse objeto como o seu parâmetro `data`.
        // Nos estamos enviando a msg do usário `userMessage` na key `prompt`, 
        // então no backend ele será acessível como `data.prompt`.
        
        console.log("Enviando para a função Firebase:", { prompt: userMessage });
        
        const payload = {

            prompt: userMessage,
            sessionId: "sess-" + Math.random().toString(36).substring(2, 8),
            userAgent: navigator.userAgent

        }

        const result = await callSendMessage(payload);
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


// 7. Função para gravar diretamente na Firestore
// ----------------------------------------------------------------
// Utilizada quando o usuário envia mensagem no chat global, sem o
// processamento e a resposta da API Gemini, grava dados no Database
// diretamente do frontend. P


async function sendMessageChat (prompt) {
    await addDoc (chatsCollection, {
        prompt: prompt,
        response:null,
        sessionId: "sess-" + Math.random().toString(36).substring(2,8),
        userAgent: navigator.userAgent,
    });
}




// Final de script.js