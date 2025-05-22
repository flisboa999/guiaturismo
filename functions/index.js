/* eslint-disable max-len */

const {GoogleGenerativeAI} = require("@google/generative-ai"); // Importa a biblioteca do Google Generative AI para usar o Gemini
const { onCall, HttpsError } = require("firebase-functions/v2/https"); // Importa o Firebase Functions para criar Funções de Nuvem
const {initializeApp} = require("firebase-admin/app"); // Importa a função initializeApp do Firebase Admin SDK
const {getFirestore} = require("firebase-admin/firestore"); // Importa a função getFirestore do Firebase Admin SDK
const {defineSecret} = require("firebase-functions/params"); // Importa a função de chaves secretas do Firebase


initializeApp(); // Inicializa o Firebase Admin SDK

const db = getFirestore(); // Obtém uma conexão com o Firestore - banco de dados

// Requisição da chave da API Gemini é feita diretamente ao servidor do Firebase / Google
// Também é possível setar a chave da API em uma varíavel local .env , recomendado para ambiente de desenvolvimento 
// Usamos functions.config().gemini.key para produção, para usar localmente em desenvolvimento use: require('dotenv').config(); + process.env.GEMINI_API_KEY;
const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.sendMessage = onCall(

    //Informa que a função sendMessage deve usar chave API do Gemini
    {secrets:["GEMINI_API_KEY"]},
    
    //onCall em vez de onRequest simplifica o processo
    async (data, context) => {

      //data - o objeto enviado pelo cliente
      //context.auth - contém informações do usuário se ele estiver logado.
      
      console.log("Tentativa de receber data");
      console.log("Printando data: ", data);
      console.log("Printando typeof data: ", (typeof data));

      //Aqui é onde de fato expõe o valor da Chave API Gemini
      const apiKey = geminiApiKey.value();
      console.log("Chave da API Gemini obtida com sucesso.");

      if (!apiKey) {
        console.error("Chave da API do Gemini não está configurada");
        throw new HttpsError('internal', 'erro de configuração do servidor: Chave da API ausente.');
      };

      // 1. Receber Input do usuário
      // Espera-se que a input do usuário venha de um campo chamado 'prompt'
      // Combina com o id="prompt-input" do HTML, e presume-se que o Javascript do lado do client vai enviar como data.prompt
      
      const userInput = data.prompt;

      console.log("Declarou variavel userInput");
      console.log("Printando userInput: ", userInput);
      console.log("Printando typeof userInput: ", (typeof userInput));


      // 2. Validação básica do Input
      if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
          console.error("Entrada inválida recebida (esperava 'prompt'):", data);
          
          // Levanta o erro HttpsError para facilitar a apuração de erros do lado do usuário (client-side)
          throw new HttpsError('invalid-argument', 'A mensagem (prompt) não pode estar vazia.');
      }

      // Print prompt recebido para debugging
      console.log("Prompt do usuário recebido:", userInput);

      // 3. Inicializar o client do Gemini
      
      //Instancia o objeto do Gemini, recebendo a chave API
      const genAI = new GoogleGenerativeAI(apiKey);
      
      
      const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest", // Or your preferred model
          // Opcional: Adicionar configurações de segurança, caso necessário
          // safetySettings: [
          //   {
          //     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          //     threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          //   },
          // ],
      });

      // 4. Fazer a Chamada na API Gemini 🚀
      try {
          console.log("Enviando solicitação para a API Gemini com o prompt:", userInput);
          const result = await model.generateContent(userInput);
          const response = await result.response;

          // Garantir que a resposta (response) e text() são válidas antes de chamar
          if (!response) {
              console.error("Resposta da API Gemini inválida ou vazia.");
              throw new HttpsError('internal', 'Resposta inválida da API Gemini.');
          }

          const geminiOutput = response.text();
          if (typeof geminiOutput !== 'string') {
                console.error("Texto da resposta da API Gemini não é uma string:", geminiOutput);
                throw new HttpsError('internal', 'Formato de resposta inesperado da API Gemini.');
          }

          console.log("Resposta da API Gemini recebida:", geminiOutput);

          // 5. Retornar a resposta ao cliente
          return { reply: geminiOutput };

      } catch (error) {
          console.error("Erro ao chamar a API Gemini:", error);

          // Armazenar mais detalhes (log) , se disponível
          if (error.response && error.response.data) {
              console.error("Detalhes do erro da API:", error.response.data);
          } else if (error.message) {
              console.error("Mensagem de erro:", error.message);
          }

          // Dá uma mensagem de erro que seja legível e amigável ao usuário
          // Se já for um erro do tipo HttpsError, relança ele; senão, cria (encapsula) um novo HttpsError com base no erro original
          if (error instanceof functions.https.HttpsError) {
              throw error; // Relança o erro original, já está no formato esperado
          }
          throw new HttpsError(
            'unknown', // Código de erro genérico
            'Falha ao processar sua mensagem com o Gemini.', // Mensagem amigável para o usuário
            error.message); // Mantém a mensagem original do erro para referência
      } 
  });