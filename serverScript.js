const express = require('express');
const { exec } = require('child_process');
const { Rcon } = require('rcon-client');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const ps = require('ps-node');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { Firestore } = require('@google-cloud/firestore');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Communication ports
const app = express();
const port = 3003;
const wsPort = 3004; // WebSocket port
app.use(express.json());
app.use(bodyParser.json());

// Configuration
const minecraftHost = '10.42.0.67'; // Replace with your Minecraft server IP address
const minecraftRconPort = 25575; // Replace with your RCON port
const rconPassword = 'pimcserver'; // Replace with your RCON password
const serviceAccount = require("./elixpomc-firebase-adminsdk-ido26-d245e1edf7.json");

// Chrome options
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1280,720', '--single-process', '--disable-extensions');
const service = new chrome.ServiceBuilder("/usr/bin/chromedriver");

// Database configs
const firestore = new Firestore({
    projectId: 'elixpomc', // Replace with your Google Cloud project ID
    keyFilename: path.join(__dirname, './elixpomc-firebase-adminsdk-ido26-d245e1edf7.json')
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://elixpomc-default-rtdb.firebaseio.com" // Replace with your Firebase database URL
});

const db = admin.database();
const statusRef = firestore.collection('minecraftStatus').doc('status');
const linkRef = firestore.collection('serverStats').doc('link');
const logFilePath = "/home/pi/mcserver/logs/latest.log";
const PropertyPath = "/home/pi/mcserver/server.properties";
const logRef = db.ref('serverLogs/log');
const propertyRef = db.ref('serverLogs/property');
const serverCmdFeedBack = db.ref('serverLogs/feedback');

const serverCpu = db.ref('serverStats/');
const serverMemory = db.ref('serverStats/');
const serverRAM = db.ref('serverStats/');
const serverPhyRAM = db.ref('serverStats/');
const serverTPS = db.ref('serverStats/');

// Stationary variables
let rcon;
let mcProcess;
let wsClients = [];
let latestLink = null;

//=======================================MAIN===================
async function initRcon() {
    let retries = 5;
    while (retries > 0) {
        try {
            if (await checkMinecraft()) {
                rcon = new Rcon({
                    host: minecraftHost,
                    port: minecraftRconPort,
                    password: rconPassword,
                    timeout: 10000 // Set a custom timeout (in milliseconds)
                });
                await rcon.connect();
                console.log('Rcon connected successfully.');
                return true;
            } else {
                console.log("Minecraft server is not running.");
                return false;
            }
        } catch (error) {
            console.error('Error connecting to Rcon:', error);
            retries--;
            if (retries > 0) {
                console.log(`Retrying in 5 seconds... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
            }
        }
    }
    return false;
}

// Function to process each log line
async function processLogLine(line) {
    const linkPattern = /https:\/\/spark\.lucko\.me\/[a-zA-Z0-9]+/g;
    const links = line.match(linkPattern);
    if (links && links.length > 0) {
        latestLink = links[links.length - 1];
        console.log("Latest link:", latestLink);
    }
}

async function sparkStats() {
    console.log("Starting to check spark stats...");
    if (await checkMinecraft()) {
        try {
            await rcon.send('spark profiler start');
            console.log("Monitoring the spark profiler for 6 seconds...");
            await new Promise(resolve => setTimeout(resolve, 6000));
            await rcon.send('spark profiler stop');
            
            let logFile = fs.readFileSync(logFilePath, 'utf-8');
            let lines = logFile.split('\n');
            lines.forEach(processLogLine);

            fs.watchFile(logFilePath, { interval: 10000 }, async (curr, prev) => {
                if (curr.mtime > prev.mtime) {
                    logFile = fs.readFileSync(logFilePath, 'utf-8');
                    lines = logFile.split('\n');
                    const newLines = lines.slice(prev.size / (logFile.length / lines.length));
                    newLines.forEach(processLogLine);
                }
                if (latestLink) {
                    await linkRef.set({ link: latestLink });
                    console.log("Link has been asserted");
                    await rcon.send('spark profiler cancel');
                    await fetchData(latestLink);
                } else {
                    await linkRef.set({ link: "null" });
                    await rcon.send('spark profiler cancel');
                    console.log("No link found, profiler cancelled.");
                }
            });
        } catch (error) {
            console.error("Error during sparkStats:", error);
            await rcon.send('spark profiler cancel'); // Ensure profiler is stopped in case of error
        }
    }
}

async function checkMinecraft() {
    return new Promise((resolve, reject) => {
        ps.lookup({ command: 'java' }, async (err, resultList) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            const isRunning = resultList.length > 0;
            try {
                await statusRef.set({ isRunning });
                console.log("Minecraft running status updated to " + isRunning);
                resolve(isRunning);
            } catch (error) {
                console.error('Error updating Firestore:', error);
                reject(error);
            }
        });
    });
}

async function uploadLogFile() {
    if (await checkMinecraft()) {
        try {
            const logFile = fs.readFileSync(logFilePath, 'utf-8');
            const formattedLogFile = logFile.replace(/\r?\n/g, '\n');
            await logRef.update({ formattedLogFile });
            console.log('Log file uploaded successfully.');
        } catch (error) {
            console.error("Error uploading log file:", error);
        }
    }
}

async function uploadPropertiesFile() {
    if (await checkMinecraft()) {
        try {
            const propertyFile = fs.readFileSync(PropertyPath, 'utf-8');
            const formattedPropertyFile = propertyFile.replace(/\r?\n/g, '\n');
            await propertyRef.update({ formattedPropertyFile });
            console.log('Property file uploaded successfully.');
        } catch (error) {
            console.error("Error uploading property file:", error);
        }
    }
}

async function getActivePlayers() {
    try {
        const response = await rcon.send('list'); // Command to list active players
        const playerList = response.split(': ')[1]; // Extract the player list from the response
        return playerList ? playerList.split(', ') : [];
    } catch (error) {
        console.error('Error getting active players:', error);
        return [];
    }
}

async function getPlayerPlaytime(player) {
    try {
        const response = await rcon.send(`/playtime ${player}`);
        const playtimeMatch = response.match(/\[(.*?)\]/);
        const playtime = playtimeMatch ? playtimeMatch[1] : 'N/A';

        console.log(`Playtime for ${player}: ${playtime}`);
        await firestore.collection('users').doc(player).update({ playedFor: playtime }, { merge: true });
    } catch (error) {
        console.error(`Error getting playtime for ${player}:`, error);
    }
}

async function logActivePlayersPlaytime() {
    const players = await getActivePlayers();
    for (const player of players) {
        await getPlayerPlaytime(player);
    }
}

async function stopServer() {
    if (await checkMinecraft()) {
        try {
            if (!rcon) {
                await initRcon();
            }
            await rcon.send("stop");
            await serverCmdFeedBack.update({ "status": "stopping" });
            console.log('Server is stopping...');

            const intervalId = setInterval(async () => {
                if (!(await checkMinecraft())) {
                    clearInterval(intervalId);
                    console.log('Server stopped successfully.');
                } else {
                    console.log('Server is still running.');
                }
            }, 5000); // Check every 5 seconds
        } catch (error) {
            console.error("Error stopping Minecraft server:", error);
        }
    }
}

async function startServer() {
    console.log("server attempting to start");
	let isRunning = await checkMinecraft();
    // Check if Minecraft is running
    if (!isRunning) {
		console.log("server is offline");
        try {
            // Start the Minecraft server
            exec('gnome-terminal -- bash -c "cd /home/pi/mcserver && ./start.sh; exec bash"', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error starting server: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });	
			  const intervalId = setInterval(async () => {
                try {
                    // Initialize Rcon and check Minecraft status
                    let rconInit = await initRcon();
                    if (checkMinecraft() === true && rconInit) {
                        clearInterval(intervalId);
                        await serverCmdFeedBack.update({ "status": "started" });
                        console.log('Server has been started');

                        await logRef.update({ "formattedLogFile": "" });
                        console.log('Log file uploaded successfully.');
                    } else {
                        await serverCmdFeedBack.update({ "status": "starting" });
                        console.log('Server is starting');
                    }
                } catch (error) {
                    console.error('Error in interval check:', error);
                }
            }, 5000);
              } catch (error) {
            console.error("Error occurred while starting server:", error);
        }
    } else {
        // Server is already running
        console.log("server is online");
        // await serverCmdFeedBack.update({ "status": "started" });
        console.log('Server is already running.');
    }
}

// =================================== WebSocket Server ===================================
const wss = new WebSocket.Server({ port: wsPort });

wss.on('connection', (ws) => {
    wsClients.push(ws);
    console.log('New WebSocket connection established.');

    ws.on('message', async (message) => {
        console.log(`Received message: ${message}`);
        if (message === 'sparkStats') {
            await sparkStats();
        } else if (message === 'startServer') {
            await startServer();
        } else if (message === 'stopServer') {
            await stopServer();
        } else if (message === 'uploadLogFile') {
            await uploadLogFile();
        } else if (message === 'uploadPropertiesFile') {
            await uploadPropertiesFile();
        } else if (message === 'logActivePlayersPlaytime') {
            await logActivePlayersPlaytime();
        }
    });

    ws.on('close', () => {
        wsClients = wsClients.filter(client => client !== ws);
        console.log('WebSocket connection closed.');
    });
});

app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
});

// Monitor the server and restart if necessary
setInterval(async () => {
    if (!(await checkMinecraft())) {
        await startServer();
    }
}, 60000); // Check every minute

// Initialize RCON and start monitoring
(async () => {
    await initRcon();
    setInterval(async () => {
        if (await checkMinecraft()) {
            await sparkStats();
            await uploadLogFile();
            await uploadPropertiesFile();
            await logActivePlayersPlaytime();
        }
    }, 60000); // Check every minute
})();
