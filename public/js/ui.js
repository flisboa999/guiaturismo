
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
export function renderMessage(docId, data, chatLog) {

    console.log("[UI][CALL] renderMessage docId:", docId, "| typeof:", typeof docId);
    console.log("[UI][CALL] renderMessage data:", data, "| typeof:", typeof data);

    // Cria um novo elemento HTML <div> para exibir a mensagem.
    const messageElement = document.createElement('div');

    console.log("[UI][INIT] messageElement criado:", messageElement, "| typeof:", typeof messageElement);

    // Adiciona a classe CSS 'message' para estilizar esse div.
    messageElement.classList.add('message');

    console.log("[UI][UPDATE] Classe 'message' adicionada ao messageElement");

    // Cria a variável content que vai conter o texto formatado da mensagem.

    let content = `<strong>Usuário:</strong> ${sanitize(data.prompt)}`;


    console.log("[UI][INIT] content criado com prompt:", content, "| typeof:", typeof content);

    // Se a mensagem tem uma resposta (ou seja, não é null ou undefined):

    if (data.response) {

        console.log("[UI][CHECK] data.response existe:", data.response, "| typeof:", typeof data.response);

        // Adiciona uma nova linha com a resposta do Gemini.
    
        content += `<br><strong>Gemini:</strong> ${sanitize(data.response)}`;

        console.log("[UI][UPDATE] content atualizado com response:", content);

    } else {
        console.log("[UI][CHECK] data.response não existe ");
    }

    // Define o conteúdo HTML da div como o texto formatado.
    messageElement.innerHTML = content;
    console.log("[UI][UPDATE] messageElement.innerHTML definido:", messageElement.innerHTML);

    // Adiciona (append) a nova div com a mensagem ao final do chatLog.
    chatLog.appendChild(messageElement);

    console.log("[UI][UPDATE] messageElement adicionado ao chatLog");

    // Faz o scroll automático do chat para mostrar a última mensagem.
    chatLog.scrollTop = chatLog.scrollHeight;
    
    console.log("[UI][UPDATE] chatLog scrolado para o final. scrollTop:", chatLog.scrollTop);
}