//const socket = new WebSocket('ws://localhost:3030/chat');
const socket = new WebSocket('ws://'+window.location.hostname+':3030/chat');
const chatLog = document.getElementById('chat-log');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
var gUsername = null;

// Event listener for when the WebSocket connection is established
socket.addEventListener('open', event => {
  console.log('Connected to chat server');
});

// Event listener for incoming messages from the server
socket.addEventListener('message', event => {
  const message = event.data;
  console.log('Received message:', message);

  // Append the received message to the chat log
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  chatLog.appendChild(messageElement);
});

// Event listener for WebSocket errors
socket.addEventListener('error', event => {
  console.error('WebSocket error:', event);
});

// Event listener for WebSocket connection closure
socket.addEventListener('close', event => {
  console.log('Disconnected from chat server');
});

// Function to send a message to the server
function sendMessage() {
  const message = messageInput.value;
  if (gUsername) {
      socket.send(JSON.stringify({"Chat": {"message": message}}));
  } else {
      gUsername = message;
      socket.send(JSON.stringify({"Login": {"username": message}}));
  }
  messageInput.value = '';
}

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key in the message input field
messageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

