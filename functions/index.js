const { GoogleGenerativeAI } = require("@google/generative-ai"); // Importa a biblioteca do Google Generative AI para usar o Gemini
const functions = require("firebase-functions"); // Importa o Firebase Functions para criar Funções de Nuvem
const { initializeApp } = require("firebase-admin/app"); // Importa a função initializeApp do Firebase Admin SDK
const { getFirestore } = require("firebase-admin/firestore"); // Importa a função getFirestore do Firebase Admin SDK

initializeApp(); // Inicializa o Firebase Admin SDK
const db = getFirestore(); // Obtém uma conexão com o Firestore

// Replace with your actual Gemini API key
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY"); // Cria uma instância do Gemini com a sua chave de API
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Seleciona o modelo Gemini Pro

exports.sendMessage = functions.https.onRequest(async (req, res) => { // Cria uma Função de Nuvem que responde a requisições HTTP
  res.set("Access-Control-Allow-Origin", "*"); // Permite requisições de qualquer site (em desenvolvimento; restrinja em produção)
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS"); // Define quais métodos HTTP são permitidos (POST e OPTIONS)
  res.set("Access-Control-Allow-Headers", "Content-Type"); // Permite o envio do cabeçalho Content-Type

  if (req.method === "OPTIONS") { // Se a requisição for do tipo OPTIONS (checagem de permissão)
    res.status(204).send(""); // Envia resposta vazia com status 204 (No Content)
    return; // Para a execução da função aqui - TESTE DE PUSH
  }

  try { // Tenta executar o código abaixo; se der erro, vai para o catch
    const { prompt } = req.body; // Pega o texto da mensagem enviada pelo usuário

    if (!prompt) { // Se o texto da mensagem estiver vazio
      res.status(400).send({ error: "Prompt é obrigatório." }); // Envia erro 400 (Bad Request)
      return; // Para a execução
    }

    const result = await model.generateContent(prompt); // Chama a API Gemini para gerar conteúdo com base no prompt
    const response = result.response.text(); // Extrai o texto da resposta do Gemini

    // Optional: Store the conversation/prompt in Firestore
    await db.collection("messages").add({ // Adiciona a mensagem e a resposta ao Firestore (banco de dados)
      prompt: prompt, // Armazena a mensagem do usuário
      response: response, // Armazena a resposta do Gemini
      timestamp: new Date(), // Armazena a data e hora
    });

    res.send({ response: response }); // Envia a resposta do Gemini de volta para o usuário
  } catch (error) { // Se ocorrer algum erro no bloco try
    console.error("Erro ao gerar resposta:", error); // Imprime o erro no console do servidor
    res.status(500).send({ error: "Falha ao gerar resposta." }); // Envia erro 500 (Internal Server Error)
  }
});
