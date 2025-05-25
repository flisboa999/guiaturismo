
import { nukeDatabase } from './network.js';

const loadingIndicator = document.getElementById('loading');  // Onde indica se está processando a mensagem

// Função sanitize → sanitiza qualquer input para evitar injeção de código malicioso (XSS)
// Cria um elemento <div> temporário no DOM (não é adicionado visualmente)
// Define o input como textContent → converte qualquer código em texto puro, neutralizando tags e scripts
// Retorna div.innerHTML → conteúdo seguro, que pode ser inserido na interface sem risco de execução indesejada
export function sanitize(input) {
    const div = document.createElement('div'); // Elemento temporário para isolar o input
    div.textContent = input;                  // Transforma o input em texto literal, escapando tags e scripts
    return div.innerHTML;                     // Retorna o conteúdo seguro, pronto para renderizar
}

// Exibe o indicador de loading → sinaliza ao usuário que uma operação está em andamento
export function showLoading() {
    loadingIndicator.style.display = 'block';
}

// Oculta o indicador de loading → sinaliza que a operação foi concluída
export function hideLoading() {
    loadingIndicator.style.display = 'none';
}

// Função que recebe: 
// - docId → ID do documento no Firestore.
// - data → dados da mensagem (prompt, response, etc.).
export function renderMessage(docId, data, chatLog, userRole) {

    console.log("[UI][CALL] renderMessage docId:", docId, "| typeof:", typeof docId);

    console.log("[UI][CALL] renderMessage data:", data, "| typeof:", typeof data);

    // Cria um novo elemento HTML <div> para exibir a mensagem.
    const messageElement = document.createElement('div');

    console.log("[UI][INIT] messageElement criado:", messageElement, "| typeof:", typeof messageElement);

    // Adiciona a classe base 'message'
    messageElement.classList.add('message');

    // Cria a variável content que vai conter o texto formatado da mensagem.
    let content = `<strong>Usuário:</strong> ${sanitize(data.prompt)}`;

    console.log("[UI][INIT] content criado com prompt:", content, "| typeof:", typeof content);

    // Se a mensagem tem uma resposta (ou seja, não é null ou undefined):
    if (data.response) {

        console.log("[UI][CHECK] data.response existe:", data.response, "| typeof:", typeof data.response);

        content += `<br><strong>Gemini:</strong> ${sanitize(data.response)}`;

        console.log("[UI][UPDATE] content atualizado com response:", content);

        messageElement.classList.add('bot-message');

        console.log("[UI][UPDATE] Classe 'bot-message' adicionada ao messageElement");
    } else {
        console.log("[UI][CHECK] data.response não existe");

        messageElement.classList.add('user-message');

        console.log("[UI][UPDATE] Classe 'user-message' adicionada ao messageElement");
    }

    // Define o conteúdo HTML da div.
    messageElement.innerHTML = content;
    console.log("[UI][UPDATE] messageElement.innerHTML definido:", messageElement.innerHTML);

    // Se o usuário for admin, adiciona o ícone de edição
    if (userRole === 'admin') {
        const editIcon = document.createElement('span');
        editIcon.textContent = '✏️';
        editIcon.classList.add('edit-icon');
        editIcon.style.cursor = 'pointer';
        editIcon.style.marginLeft = '10px';

        editIcon.addEventListener('click', () => {
            openEditPopup(docId, data.prompt);
        });

        messageElement.appendChild(editIcon);
        console.log("[UI][UPDATE] Ícone de edição '✏️' adicionado ao messageElement");
    }

    // Adiciona a nova div com a mensagem ao final do chatLog.
    chatLog.appendChild(messageElement);
    console.log("[UI][UPDATE] messageElement adicionado ao chatLog");

    // Faz o scroll automático do chat para mostrar a última mensagem.
    chatLog.scrollTop = chatLog.scrollHeight;
    console.log("[UI][UPDATE] chatLog scrolado para o final. scrollTop:", chatLog.scrollTop);
}


// renderAdminControls → cria e insere dinamicamente o painel de controle administrativo na interface
export function renderAdminControls() {

    console.log("[UI][CALL] Função renderAdminControls chamada");

    const adminPanel = document.createElement('div');// Cria container para centralizar os controles admin
    
    console.log("[UI][INIT] adminPanel criado:", adminPanel, "| typeof:", typeof adminPanel);

    adminPanel.id = 'admin-panel'; // Define ID para possível estilização ou referência
    
    console.log("[UI][UPDATE] adminPanel.id definido:", adminPanel.id);

    const nukeButton = document.createElement('button'); // Cria botão específico para a ação de deletar banco
    
    console.log("[UI][INIT] nukeButton criado:", nukeButton, "| typeof:", typeof nukeButton);

    nukeButton.textContent = '💣 Nuke Banco'; // Texto claro e visualmente impactante

    nukeButton.addEventListener('click', nukeDatabase);

    console.log("[UI][UPDATE] adicionou event listener a nukeButton , recebendo args 'click' e nukeDatabase");
    
    
    console.log("[UI][UPDATE] nukeButton.textContent definido:", nukeButton.textContent);

    nukeButton.style.background = 'red';  // Cor vermelha para transmitir perigo
    nukeButton.style.color = 'white';   // Contraste para legibilidade
   
    console.log("[UI][UPDATE] nukeButton estilo definido: background:", nukeButton.style.background, ", color:", nukeButton.style.color);

    
    console.log("[UI][BIND] nukeButton.onclick definido para nukeDatabase");

    adminPanel.appendChild(nukeButton);// Insere o botão dentro do painel admin
    
    console.log("[UI][UPDATE] nukeButton adicionado ao adminPanel");

    const chatContainer = document.querySelector('.chat-container');  
    
    console.log("[UI]][SELECT] chatContainer encontrado:", chatContainer, "| typeof:", typeof chatContainer);

    if (!chatContainer) {

        console.error("[UI][ERROR] .chat-container não encontrado!");
        return;
    }

    chatContainer.appendChild(adminPanel); 
    
    console.log("[UI][UPDATE] adminPanel adicionado ao chatContainer");
}


// updateRenderedMessage → atualiza dinamicamente o conteúdo de uma mensagem existente na interface
export function updateRenderedMessage(docId, newData) {

    console.log("[UI][CALL] Função updateRenderedMessage chamada com docId:", docId, " | typeof:", typeof docId);
    
    console.log("[UI][INIT] newData recebido:", newData, "| typeof:", typeof newData);

    const messageElement = document.getElementById(`msg-${docId}`); // Busca o elemento pelo ID único gerado no render
    console.log("[UI][SELECT] messageElement buscado:", messageElement, "| typeof:", typeof messageElement);

    if (messageElement) {

        const sanitizedPrompt = sanitize(newData.prompt);

        console.log("[UI][INIT] sanitizedPrompt:", sanitizedPrompt, "| typeof:", typeof sanitizedPrompt);

        messageElement.innerHTML = `<strong>Usuário:</strong> ${sanitizedPrompt}`;

        console.log("[UI][UPDATE] messageElement.innerHTML atualizado:", messageElement.innerHTML);
        
        // Pode adicionar nova renderização para response, se necessário

    } else {
        console.warn("[UI][WARN] messageElement não encontrado para docId:", docId);
    }
}

export function showEditPopup(currentText, callback) {  
    // Abstração para exibir popup de edição → reutilizável para qualquer mensagem
    // Recebe: 
    // → currentText: texto atual da mensagem 
    // → callback: função a ser chamada com o novo texto

    const newText = prompt("Edite a mensagem:", currentText);  
    // Exibe prompt nativo → pré-preenchido com o texto atual para facilitar edição

    if (newText !== null) {  
        // Usuário clicou em "OK" → continua
        // Se clicar em "Cancelar" → ignora silenciosamente

        callback(newText.trim());  
        // Passa o texto editado e limpo (sem espaços extras) para a função de atualização
    }  
    // Se cancelou → não executa nada, mantendo o texto original
}



export function sendSystemMessage(message) {
    console.log("[SYSTEM][CALL] Mensagem de sistema enviada:", message);
    alert(message);  // Ou use um mecanismo de exibição no chat
}