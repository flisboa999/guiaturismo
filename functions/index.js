/* eslint-disable max-len */

// Importa a lib do Google Generative AI para usar o Gemini e instanciar objeto do Modelo LLM 
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Importa `onCall`, permite chamadas de funções cloud direto pelo cliente (frontend) em SDK Javascript
// `HttpsError` permite enviar erros estruturados e padronizados.
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// Importa do Firebase Admin SDK:
// - `initializeApp` → inicia o app backend, liberando serviços como DB e auth.
// - `getFirestore` → conecta ao Firestore, permitindo operações seguras no banco.
// - `FieldValue` → cria valores especiais no Firestore, como timestamps automáticos.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Importa utilitário para acessar chaves secretas no Google Secret Manager
const { defineSecret } = require("firebase-functions/params");

// Inicializa o Firebase Admin SDK
initializeApp();

console.log("[INIT] Inicializando Firebase Admin SDK");

// Obtém uma instância do Firestore
const db = getFirestore();

console.log("[INIT] Firestore conectado");

// Define a variável da chave secreta da API Gemini via Secret Manager ( gerenciamento de chaves)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

console.log("[INIT] Chave secreta GEMINI_API_KEY definida");

// Exporta a função sendMessage como função em nuvem (cloud function)
exports.sendMessage = onCall(
  
    { secrets: ["GEMINI_API_KEY"] }, // Declara que a função precisa da Chave Secreta da API Gemini
  
    async (data, context) => {  // Função assíncrona que processa a mensagem

    console.log("[CALL] sendMessage chamada");

    console.log("[CHECK] data recebido:", data, "| typeof:", typeof data);

    // Obtém a chave da API Gemini via Secret Manager
    const apiKey = geminiApiKey.value();

    console.log("[CHECK] apiKey obtido:", apiKey ? "sim" : "não");

    // Valida se a chave existe
    if (!apiKey) {

      console.error("[ERROR] Chave da API do Gemini não configurada");

      throw new HttpsError('internal', 'erro de configuração do servidor: Chave da API ausente.');
    }

    // Extrai dados do payload usando optional chaining
    const userInput = data?.data?.prompt;     // Texto enviado pelo usuário
    const sessionId = data?.data?.sessionId;  // ID da sessão do usuário
    const userAgent = data?.data?.userAgent;  // Info sobre navegador/dispositivo

    // Logs para verificar os dados recebidos
    console.log("[INIT] userInput:", userInput, "| typeof:", typeof userInput);
    console.log("[INIT] sessionId:", sessionId, "| typeof:", typeof sessionId);
    console.log("[INIT] userAgent:", userAgent, "| typeof:", typeof userAgent);

    // Na validação do userInput está vazio, não é string ou só tem espaços.
    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
      console.error("[ERROR] Entrada inválida recebida:", data.data);
      throw new HttpsError('invalid-argument', 'A mensagem (prompt) não pode estar vazia.');
    }

    console.log("[CHECK] Prompt do usuário recebido:", userInput);

    // Inicializa o cliente da API Gemini, receve a chave API como argumento
    console.log("[INIT] Instanciando GoogleGenerativeAI");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Configura o modelo do Gemini
    console.log("[INIT] Configurando modelo Gemini");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // Define a versão do modelo
    });

    try {
      // Faz chamada para a API Gemini com o prompt do usuário
      console.log("[CALL] Enviando solicitação para API Gemini com prompt: ", userInput);
      const result = await model.generateContent(userInput);  // Gera a resposta com base no prompt

      console.log("[INIT] result:", result, "| typeof:", typeof result);

      const response = await result.response;  // Extrai a resposta gerada

      console.log("[INIT] response:", response, "| typeof:", typeof response);

      // Se não houve resposta, levanta erro
      if (!response) {
        console.error("[ERROR] Resposta da API Gemini inválida ou vazia");
        throw new HttpsError('internal', 'Resposta inválida da API Gemini.');
      }

      // Extrai o texto da resposta
      const geminiOutput = response.text();

      console.log("[INIT] geminiOutput:", geminiOutput, "| typeof:", typeof geminiOutput);

      // Monta o documento de chat com todos os dados
      const chatDoc = {
        prompt: userInput,                         // Texto enviado
        response: geminiOutput || null,            // esposta gerada ou null
        timestamp: FieldValue.serverTimestamp(),   // Timestamp do servidor
        sessionId: sessionId || null,              // ID da sessão
        userAgent: userAgent || null,              // Info do cliente
        userId: context.auth ? context.auth.uid : null // ID do usuário autenticado ou null
      };

      console.log("[INIT] chatDoc criado:", chatDoc);

      try {

        // Salva o chat no Firestore
        const docRef = await db.collection('chats').add(chatDoc);

        console.log("[UPDATE] chatDoc salvo no Firestore, ID:", docRef.id);
      
    } catch (dbError) {

        // Captura e trata dos erros ao salvar no Firestore
        console.error("[ERROR] Falha ao salvar no Firestore:", dbError, "| chatDoc:", chatDoc);

        throw new HttpsError('internal', 'Falha ao salvar a mensagem');
      }

      // Detecta erro se a resposta não for uma string
      if (typeof geminiOutput !== 'string') {
        console.error("[ERROR] geminiOutput não é string:", geminiOutput);

        throw new HttpsError('internal', 'Formato de resposta inesperado da API Gemini.');
      }

      console.log("[RETURN] Resposta da API Gemini:", geminiOutput);

      // Retorna a resposta ao cliente
      return { reply: geminiOutput };

    } catch (error) {

      // Captura qualquer erro no processamento ou na chamada da API
      console.error("[ERROR] Erro ao chamar a API Gemini:", error);

      // Tenta logar detalhes adicionais do erro
      if (error.response && error.response.data) {
        console.error("[ERROR] Detalhes do erro da API:", error.response.data);

      } else if (error.message) {
        console.error("[ERROR] Mensagem de erro:", error.message);

      }

      // Se já for um erro do tipo HttpsError, relança
      if (error instanceof HttpsError) {
        throw error;

      }

      // Se for outro tipo de erro, encapsula como HttpsError
      throw new HttpsError(
        'unknown',
        'Falha ao processar sua mensagem com o Gemini.',
        error.message
      );
    }
  }
);
