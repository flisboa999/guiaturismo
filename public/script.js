const chatLog = document.getElementById('chat-log');
const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const apiUrl = '<YOUR_CLOUD_FUNCTIONS_URL>';  // **Replace this with your Cloud Function URL**

sendButton.addEventListener('click', sendMessage);
promptInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    appendMessage('user', prompt);
    promptInput.value = '';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        appendMessage('bot', data.response);
    } catch (error) {
        console.error('Error sending message:', error);
        appendMessage('bot', 'Sorry, I encountered an error.');
    }
}

function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(`${sender}-message`);
    messageDiv.textContent = message;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}
