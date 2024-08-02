window.onload = function() {
    globalThis.serverStatus = 'offline';
}

const firebaseConfig = {
    apiKey: "AIzaSyDVXrNMHxSYJVAXHSCxb3OLAAThfs11KZw",
    authDomain: "elixpomc.firebaseapp.com",
    projectId: "elixpomc",
    storageBucket: "elixpomc.appspot.com",
    messagingSenderId: "724065825212",
    appId: "1:724065825212:web:dcb7abb240b73b7d2cbbb9"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  const socket = new WebSocket('ws://10.42.0.66:3004'); // Connect to WebSocket server

// Update console output with real-time updates
socket.onmessage = function(event) {
    const message = event.data;
    console.log('Console Update:', message);
    document.getElementById('console-output').innerText += `\n${message}`;
};

// Function to fetch online players and update the UI
async function fetchOnlinePlayers() {
    try {
        const response = await fetch('http://10.42.0.66:3003/players');
        const data = await response.json();
        console.log('Online Players:', data.players);

        // Display online players
        document.getElementById('players-list').innerText = data.players || 'No players online';
    } catch (error) {
        console.error('Error fetching online players:', error);
    }
}

// Function to fetch server status and update the UI
async function fetchServerStatus() {
    try {
        const response = await fetch('http://10.42.0.66:3003/status');
        const data = await response.json();
        console.log('Game Status:', data.status);
        serverStatus = data.status;
        // Display server status
        // document.getElementById('server-status').innerText = `Server is ${data.status}`;
    } catch (error) {
        console.error('Error fetching server status:', error);
        // document.getElementById('server-status').innerText = 'Error fetching server status';
    }
}



// Fetch online players and server status initially and periodically
fetchOnlinePlayers();
fetchServerStatus();
setInterval(fetchOnlinePlayers, 60000); // Update every minute
setInterval(fetchServerStatus, 30000); // Check server status every 30 seconds


// Function to start the server
async function startServer() {
    try {
        const response = await fetch('http://10.42.0.66:3003/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        console.log('Start Server Response:', data.message);
        // Optionally, update the UI to show start status
        document.getElementById('console-output').innerText += `\n> Server start initiated.\n${data.message}`;
    } catch (error) {
        console.error('Error starting server:', error);
        document.getElementById('console-output').innerText += `\n> Error starting server: ${error.message}`;
    }
}

// Bind startServer to button click
document.getElementById('startServer').addEventListener('click', startServer);
