const socket = new WebSocket('ws://10.42.0.66:3004'); // Connect to WebSocket server

// Handle incoming messages from WebSocket server
socket.onmessage = function(event) {
    const message = event.data;
    console.log('Console Update:', message);
    document.getElementById('console-output').innerText += `\n${message}`;
};

// Function to send a console command via WebSocket
function sendConsoleCommand() {
    const command = document.getElementById('console-command').value;
    if (command.trim() === '') return;

    socket.send(command);
    document.getElementById('console-output').innerText += `\n> ${command}`;
}

// Bind sendConsoleCommand to button click
document.getElementById('sendConsoleCmd').addEventListener('click', sendConsoleCommand);