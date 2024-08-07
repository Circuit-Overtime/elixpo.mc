const express = require('express');
const { Rcon } = require('rcon-client');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const ps = require('ps-node');
const admin = require('firebase-admin');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');
const app = express();
const port = 3003;
const wsPort = 3004; // WebSocket port

app.use(express.json());

// Configuration
const minecraftHost = '10.42.0.66'; // Replace with your Minecraft server IP address
const minecraftRconPort = 25575; // Replace with your RCON port
const rconPassword = 'pimcserver'; // Replace with your RCON password

// Initialize Firebase
const serviceAccount = require(path.join(__dirname, './elixpomc-firebase-adminsdk-ido26-6e73a16296.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = new Firestore();
const statusRef = firestore.collection('minecraftStatus').doc('status');

let rcon;
let mcProcess;
let wsClients = [];

// Initialize RCON connection
async function initRcon() {
    rcon = new Rcon({
        host: minecraftHost,
        port: minecraftRconPort,
        password: rconPassword
    });
    await rcon.connect();
}

initRcon().catch(console.error);

// Get Online Players
app.get('/players', async (req, res) => {
    try {
        const response = await rcon.send('list');
        const players = response.split(':')[1];
        res.json({ players });
    } catch (error) {
        res.json({ error: error.message });
    }
});

app.get('/status', async (req, res) => {
    try {
        await rcon.send('list'); // If this succeeds, the server is online
        res.json({ status: 'online' });
    } catch (error) {
        res.json({ status: 'offline', error: error.message });
    }
});

app.post('/start', (req, res) => {
    if (mcProcess) {
        return res.json({ message: 'Server is already running' });
    }

    mcProcess = spawn('bash', ['-c', 'cd /home/pi/mcserver && java -Xmx4G -Xms4G -jar fabric-server-launch.jar nogui']);

    mcProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });
    });

    mcProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
            }
        });
    });

    mcProcess.on('close', (code) => {
        console.log(`Minecraft server process exited with code ${code}`);
        mcProcess = null;
        wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Minecraft server stopped with exit code ${code}`);
            }
        });
    });

    res.json({ message: 'Server start command sent' });
});

// Check if Minecraft is running
async function checkMinecraft() {
    ps.lookup({ command: 'java' }, async (err, resultList) => {
        if (err) {
            console.error(err);
            return;
        }

        const isRunning = resultList.length > 0;

        try {
            await statusRef.set({
                isRunning,
            });
            console.log(`Minecraft running status updated to ${isRunning}`);
        } catch (error) {
            console.error('Error updating Firestore:', error);
        }
    });
}

// Check Minecraft status every 10 seconds
setInterval(checkMinecraft, 10000);

// Route to get Minecraft running status
app.get('/minecraftRunning', async (req, res) => {
    try {
        const doc = await statusRef.get();
        if (!doc.exists) {
            res.json({ error: 'No status found' });
            return;
        }
        res.json(doc.data());
    } catch (error) {
        res.json({ error: error.message });
    }
});

const wsServer = new WebSocket.Server({ port: wsPort });

wsServer.on('connection', (ws) => {
    console.log('New WebSocket connection');
    wsClients.push(ws);

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        wsClients = wsClients.filter(client => client !== ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
