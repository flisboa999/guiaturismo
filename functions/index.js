/* eslint-disable max-len */

const {GoogleGenerativeAI} = require("@google/generative-ai"); // Importa a biblioteca do Google Generative AI para usar o Gemini
const functions = require("firebase-functions"); // Importa o Firebase Functions para criar Funções de Nuvem
const {initializeApp} = require("firebase-admin/app"); // Importa a função initializeApp do Firebase Admin SDK
const {getFirestore} = require("firebase-admin/firestore"); // Importa a função getFirestore do Firebase Admin SDK
const {defineSecret} = require("firebase-functions/params"); // Importa a função de chaves secretas do Firebase
const {onCall} = require("firebase-functions/v2/https");

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
        throw new functions.https.HttpsError('internal', 'erro de configuração do servidor: Chave da API ausente.');
      };

      // 1. Receber Input do usuário
      // Espera-se que a input do usuário venha de um campo chamado 'prompt'
      // Combina com o id="prompt-input" do HTML, e presume-se que o Javascript do lado do client vai enviar como data.prompt
      
      const userInput = data.prompt;

      console.log("Declarou variavel userInput");
      console.log("Printando userInput: ", data);
      console.log("Printando typeof userInput: ", (typeof userInput));


      // 2. Validação básica do Input
      if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
          console.error("Entrada inválida recebida (esperava 'prompt'):", data);
          
          // Levanta o erro HttpsError para facilitar a apuração de erros do lado do usuário (client-side)
          throw new functions.https.HttpsError('invalid-argument', 'A mensagem (prompt) não pode estar vazia.');
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
              throw new functions.https.HttpsError('internal', 'Resposta inválida da API Gemini.');
          }

          const geminiOutput = response.text();
          if (typeof geminiOutput !== 'string') {
                console.error("Texto da resposta da API Gemini não é uma string:", geminiOutput);
                throw new functions.https.HttpsError('internal', 'Formato de resposta inesperado da API Gemini.');
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
          throw new functions.https.HttpsError(
            'unknown', // Código de erro genérico
            'Falha ao processar sua mensagem com o Gemini.', // Mensagem amigável para o usuário
            error.message); // Mantém a mensagem original do erro para referência
      } 
  });









// Código antigo comentado para reescrever a função do 0

/*

exports.sendMessage = functions.runWith({secrets:[geminiApiKeySecret]}).https.onRequest(async (req, res) => { // Cria uma Função de Nuvem que responde a requisições HTTP
  res.set("Access-Control-Allow-Origin", "*"); // Permite requisições de qualquer site (em desenvolvimento; restrinja em produção)
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); // Define quais métodos HTTP são permitidos (POST e OPTIONS)
  res.set("Access-Control-Allow-Headers", "Content-Type"); // Permite o envio do cabeçalho Content-Type

  if (req.method === "OPTIONS") { // Se a requisição for do tipo OPTIONS (checagem de permissão)
    res.status(204).send(""); // Envia resposta vazia com status 204 (No Content)
    return; // Para a execução da função aqui - TESTE DE PUSH
  }

  try { // Tenta executar o código abaixo; se der erro, vai para o catch
    const {prompt} = req.body; // Pega o texto da mensagem enviada pelo usuário

    if (!prompt) { // Se o texto da mensagem estiver vazio
      res.status(400).send({error: "Prompt é obrigatório."}); // Envia erro 400 (Bad Request)
      return; // Para a execução
    }

    const result = await model.generateContent(prompt); // Chama a API Gemini para gerar conteúdo com base no prompt
    const response = result.response.text(); // Extrai o texto da resposta do Gemini

    // Armazenar a conversa e os prompts no banco de dados Firestore
    await db.collection("messages").add({ // Adiciona a mensagem e a resposta ao Firestore (banco de dados)
      prompt: prompt, // Armazena a mensagem do usuário
      response: response, // Armazena a resposta do Gemini
      timestamp: new Date(), // Armazena a data e hora
    });

    res.send({response: response}); // Envia a resposta do Gemini de volta para o usuário
  } catch (error) { // Se ocorrer algum erro no bloco try
    console.error("Erro ao gerar resposta:", error); // Imprime o erro no console do servidor
    res.status(500).send({error: "Falha ao gerar resposta."}); // Envia erro 500 (Internal Server Error)
  }
});


*/


