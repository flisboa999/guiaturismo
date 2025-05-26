// collection → referencia ou cria coleções; query/orderBy/limit → constroem consultas com filtros e ordenação; onSnapshot → escuta mudanças em tempo real no Firestore
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// db → instância configurada do Firestore, usada para todas as operações no banco de dados
import { db } from "./firebase-setup.js";


import { removeRenderedMessage } from './ui.js';

// Referência à coleção "chats" no Firestore, onde as mensagens serão criadas, lidas e monitoradas em tempo real
export const chatsCollection = collection(db, "chats");

// Cria uma query: pega os documentos da coleção 'chats', ordenados por 'timestamp' de forma crescente
// e limita para as últimas 50 mensagens; É ajustável conforme necessidade
export const chatsQuery = query(
    chatsCollection,            // Referência da coleção
    orderBy('timestamp', 'asc'),  // Ordena pela data (mais antigas primeiro) 
    limit(50)                   // Limita a 50 mensagens
);

// initSnapshot → Inicializa e configura listener reativo em "chats"; 
// onSnapshot → Cria listener reativo em "chats" para sincronizar/renderizar a Interface em tempo real, baseado nas coleções do banco de dados Firestore
// Snapshot → Cópia fiel e instantânea dos dados no momento da mudança (create, update, delete), dispara automático no acionamento de consulta ou do listener
// Dispara automaticamente sempre que um novo documento (mensagem) é adicionado
// Cria um listener em tempo real na coleção "chats" (Listener: "ouve" alterações em tempo real)


// initSnapshot → inicializa listener reativo na coleção "chats"; sincroniza automaticamente a UI com mudanças em tempo real
export function initSnapshot(chatsCollection, renderMessage, chatLog) {

    // onSnapshot → escuta alterações (create, update, delete) na coleção e dispara callback ao detectar mudanças
    onSnapshot(chatsCollection, (snapshot) => {

        // Itera sobre as mudanças específicas desde o último snapshot (delta, não o estado completo)
        snapshot.docChanges().forEach((change) => {

            const docId = change.doc.id;   // ID único do documento → fundamental para identificar a mensagem na UI
            const data = change.doc.data(); // Dados atualizados da mensagem → usados para renderizar ou atualizar

            if (change.type === "added") {
                renderMessage(docId, data, chatLog);  
                // Nova mensagem → renderiza e adiciona dinamicamente na interface
            }

            if (change.type === "modified") {
                updateRenderedMessage(docId, data);  
                // Mensagem existente foi alterada → atualiza conteúdo na interface para refletir a mudança
            }

            if (change.type === "removed") {
                removeRenderedMessage(docId);        
                // Mensagem excluída do banco → remove da interface para manter consistência visual
            }
        });
    });
}
