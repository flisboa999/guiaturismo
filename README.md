
# 🧩 Chat Público com Firebase + Firestore + Gemini API

🔥 Projeto acadêmico para demonstrar integração Full Serverless: Chat Público com database em tempo real + AI com Firebase e LLM Gemini.

https://www.youtube.com/watch?v=pquHcxghVE8

## ✅ Visão Geral

Este projeto foi desenvolvido como parte do **Projeto Integrador em Computação III — DRP06 — Turma 001** da **UNIVESP (Universidade Virtual do Estado de São Paulo)**.

O sistema implementa um **Chat Público em tempo real** com integração à **API Gemini** para processamento de linguagem natural.

## ✅ Funcionalidades principais

- ✅ **Chat Público:** mensagens são armazenadas no **Firebase Firestore** e exibidas para todos em tempo real.
- ✅ **Mensagens com IA (Gemini):** integração com **Firebase Functions** que envia perguntas à **API Gemini** e exibe as respostas no chat.
- ✅ **Autenticação Google:** apenas usuários autenticados podem enviar mensagens.
- ✅ **Admin Controls:** usuários com perfil `admin` podem apagar todas as mensagens (`Nuke`).

## ✅ Arquitetura do Projeto

**Backend:**
- **Firebase Functions:** comunicação segura com API Gemini.
- **Firestore Database (noSQL):** persistência de mensagens e respostas.

**Frontend:**
- **JavaScript Vanilla:** toda a lógica implementada com modularização.
- **Firebase Auth:** login com Google.
- **UI reativa:** atualizações automáticas via Firestore `onSnapshot()`.

## ✅ Organização Modular do Código

| Arquivo                | Função |
|----------------------- |------- |
| **firebase-setup.js**  | Configura Firebase (`auth`, `db`, `functions`). |
| **network.js**         | Lida com envio de mensagens ao Firestore e à API Gemini. Inclui `sendMessageToGemini`, `sendMessageChat`, `editMessage`, `nukeDatabase`. |
| **state.js**           | Gerencia `chatsCollection` e listeners de atualização (`initSnapshot`). |
| **ui.js**              | Renderiza mensagens (`renderMessage`), controles administrativos, e gerencia interface (`showLoading`, `showEditPopup`). |
| **main.js**            | Orquestra autenticação, define roles (`userRole`), e gerencia fluxo principal. |

## ✅ Fluxo de Execução

1. Usuário acessa a aplicação → é autenticado via Google.
2. Selecione entre enviar:
   - Mensagem **Pública** → salva diretamente no Firestore.
   - Mensagem para **Gemini** → processada via Firebase Functions + API Gemini → resposta salva no Firestore.
3. Mensagens exibidas automaticamente a todos via **onSnapshot**.
4. Usuário com role **admin** pode apagar todas as mensagens (`Nuke Banco`).

## ✅ Tecnologias

- **Firebase Firestore:** banco de dados em tempo real.
- **Firebase Functions:** execução de lógica backend sem servidor.
- **Firebase Authentication:** login com Google.
- **API Gemini:** integração de inteligência artificial.
- **JavaScript Vanilla:** frontend puro, modular e eficiente.

## ✅ Como Executar

1. Configure o projeto no **Firebase Console** (Auth, Firestore, Functions).
2. Atualize o arquivo `firebaseConfig` com as chaves do projeto.
3. Execute localmente ou via **Firebase Hosting**.

## ✅ Créditos

**Projeto Integrador em Computação III — DRP06 — Turma 001**  
**UNIVESP — Universidade Virtual do Estado de São Paulo**

### 👥 Integrantes:  
- Beatriz Cristina Lima dos Santos  
- Felipe Lisboa Correa  
- Gabriela Cristina Faria Henrique  
- Glaucia do Rosário Nuli Hector Pinto  
- Leandro Michele Aparecida dos Santos Oliveira  
- Milene Rocha da Silva  
- Walter Feitosa Firmino  

**Polos:** Iporanga, Apiaí, Avaré — SP  

## ✅ Sugestões de melhoria

- Melhorar sistema de roles e permissões.
- Adicionar múltiplos canais de chat.
- Adicionar novas APIs de outros LLM (DeepSeek, ChatGPT, Claude,etc.)
- Interface com frameworks modernos (React, Vue).
