// State object to keep track of the assistant, thread, and messages
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};


// Function to get the list of assistants and populate the dropdown
async function getAssistants() {
  try {
    console.log('Fetching list of assistants...');
    const response = await fetch('/api/assistants');

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error data from /api/assistants:', errorData);
      throw new Error(errorData.error || 'Failed to get assistants');
    }

    const data = await response.json();
    console.log('Assistants data:', data);

    const assistantSelect = document.getElementById('assistantSelect');

    data.assistants.forEach((assistant) => {
      const option = document.createElement('option');
      option.value = assistant.id;
      option.textContent = assistant.name;
      assistantSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error getting assistants:', error);
    writeToMessages(`Error: ${error.message}`);
  }
}

// Function to select an assistant
function selectAssistant() {
  const assistantSelect = document.getElementById('assistantSelect');
  state.assistant_id = assistantSelect.value;
  state.assistant_name = assistantSelect.options[assistantSelect.selectedIndex].text;
  
  console.log('Selected assistant:', state.assistant_name, 'ID:', state.assistant_id);

  // Create a new thread with the selected assistant
  createThread();
}

// Function to create a new thread
async function createThread() {
  try {
    console.log('Creating thread with assistant_id:', state.assistant_id);
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assistant_id: state.assistant_id }),
    });

    console.log('Response status from /api/threads:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error data from /api/threads:', errorData);
      throw new Error(errorData.error || 'Failed to create thread');
    }

    const data = await response.json();
    console.log('Thread creation data:', data);
    state.threadId = data.threadId;
    state.messages = [];
    writeToMessages(`New thread created with assistant: ${state.assistant_name}`);
  } catch (error) {
    console.error('Error creating thread:', error);
    writeToMessages(`Error: ${error.message}`);
  }
}

// Function to send a message
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (!message || !state.threadId) {
    console.log('No message entered or threadId is missing.');
    return;
  }

  try {
    console.log('Sending message:', message, 'to threadId:', state.threadId);
    await fetch(`/api/threads/${state.threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    writeToMessages(`You: ${message}`, 'user');

    // Run the thread
    await runThread();

    // Retrieve messages
    await getMessages();
  } catch (error) {
    console.error('Error sending message:', error);
    writeToMessages(`Error: ${error.message}`);
  } finally {
    messageInput.value = '';
  }
}

// Function to run the thread
async function runThread() {
  try {
    console.log('Running thread with threadId:', state.threadId);
    const response = await fetch(`/api/threads/${state.threadId}/run`, {
      method: 'POST',
    });

    console.log('Response status from /run:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error data from /run:', errorData);
      throw new Error(errorData.error || 'Failed to run thread');
    }
  } catch (error) {
    console.error('Error running thread:', error);
    writeToMessages(`Error: ${error.message}`);
  }
}

// Function to get messages from the thread
async function getMessages() {
  try {
    console.log('Fetching messages for threadId:', state.threadId);
    const response = await fetch(`/api/threads/${state.threadId}/messages`);

    console.log('Response status from /messages:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error data from /messages:', errorData);
      throw new Error(errorData.error || 'Failed to get messages');
    }

    const data = await response.json();
    console.log('Messages data:', data);

    const messagesContainer = document.getElementById('message-container');
    messagesContainer.innerHTML = ''; // Clear existing messages

    data.messages.forEach((msg) => {
      if (msg.role === 'user') {
        writeToMessages(`You: ${msg.content}`, 'user');
      } else if (msg.role === 'assistant') {
        writeToMessages(`Assistant: ${msg.content}`, 'assistant');
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    writeToMessages(`Error: ${error.message}`);
  }
}

// Function to display messages
function writeToMessages(message, role = '') {
  const messageContainer = document.getElementById('message-container');
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.className = `message ${role}`;
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  console.log('Message written to DOM:', message);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, initializing...');
  getAssistants();
});
