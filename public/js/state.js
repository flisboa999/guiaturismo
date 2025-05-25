// collection → referencia ou cria coleções; query/orderBy/limit → constroem consultas com filtros e ordenação; onSnapshot → escuta mudanças em tempo real no Firestore
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// db → instância configurada do Firestore, usada para todas as operações no banco de dados
import { db } from "./firebase-setup.js";

// Referência à coleção "chats" no Firestore, onde as mensagens serão criadas, lidas e monitoradas em tempo real
export const chatsCollection = collection(db, "chats");

// Cria uma query: pega os documentos da coleção 'chats', ordenados por 'timestamp' de forma crescente
// e limita para as últimas 50 mensagens; É ajustável conforme necessidade
export const chatsQuery = query(
    chatsCollection,            // Referência da coleção
    orderBy('timestamp', 'asc'),  // Ordena pela data (mais antigas primeiro) 
    limit(50)                   // Limita a 50 mensagens
);

// onSnapshot → Cria listener reativo em "chats" para sincronizar a Interface (UI) em tempo real as coleções do banco de dados Firebase
// Snapshot → Cópia fiel e instantânea dos dados no momento da mudança (create, update, delete), aciona automático no acionamento da consulta ou do listener
// Dispara automaticamente sempre que um novo documento (mensagem) é adicionado
// Cria um listener em tempo real na coleção "chats" (Listener: "ouve" alterações em tempo real)


export function initSnapshot(chatsCollection, renderMessage, chatLog) {

    onSnapshot(chatsCollection, (snapshot) => {
    
    // Itera sobre as mudanças detectadas, evitando processar o snapshot completo desnecessariamente
    snapshot.docChanges().forEach((change) => {

        // Se a mudança for "added" → novo documento criado; ignora updates e deletes para otimizar a renderização
        if (change.type === "added") {

            // Chama renderMessage para inserir a nova mensagem na UI de forma dinâmica e incremental
            // Passa: 1) ID único do doc (para rastreamento e manipulação futura); 2) dados da mensagem
            renderMessage(change.doc.id, change.doc.data(), chatLog);
        }
    });
});
}
