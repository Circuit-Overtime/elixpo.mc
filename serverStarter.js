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

//communication ports
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

//chrome options
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless');  // Run in headless mode
chromeOptions.addArguments('--disable-gpu');  // Disable GPU acceleration
chromeOptions.addArguments('--no-sandbox');  // Recommended for Linux systems
chromeOptions.addArguments('--disable-dev-shm-usage');  // Overcome limited resource problems
chromeOptions.addArguments('--window-size=1280,720'); // Set a smaller window size to save resources
chromeOptions.addArguments('--single-process'); // Use a single process
chromeOptions.addArguments('--disable-extensions'); // Disable extensions
const service = new chrome.ServiceBuilder("/usr/bin/chromedriver");

//database configs
const firestore = new Firestore({
    projectId: 'elixpomc', // Replace with your Google Cloud project ID
    keyFilename: path.join(__dirname, './elixpomc-firebase-adminsdk-ido26-d245e1edf7.json')
});

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://elixpomc-default-rtdb.firebaseio.com" // Replace with your Firebase database URL
});

//database referrals
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

//stationary variables
let rcon;
let mcProcess;
let wsClients = [];
let latestLink = null;

//=======================================MAIN===================
async function initRcon() {
	let isRunning = await checkMinecraft();
    if (isRunning) {
        try {
            rcon = new Rcon({
                host: minecraftHost,
                port: minecraftRconPort,
                password: rconPassword,
                timeout: 10000 // Set a custom timeout (in milliseconds)
            });
            await rcon.connect();
            console.log('Rcon connected successfully.');
            return true;
        } catch (error) {
            console.error('Error connecting to Rcon. Retrying in 5 seconds...', error);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
            
        }
    }
    else
    {
		console.log("Rcon not connecting, minecraft not running");
		return false;
	}
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
	console.log("starting to check spark stats");
	let isRunning = await checkMinecraft();
    if (isRunning) {
        try {
            const responseStart = await rcon.send('spark profiler start');
            console.log("Monitoring the spark profiler for 6 seconds...");
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            const responseStop = await rcon.send('spark profiler stop');
            
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
                    const responseCancelOK = await rcon.send('spark profiler cancel');
                    await fetchData(latestLink);
                } else {
                    await linkRef.set({ link: "null" });
                    const responseCancelEx = await rcon.send('spark profiler cancel');
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
			let statusText = isRunning ? "started" : "stopped";
            try {
				let isRconConnected = await initRcon();
				let statusText = isRunning ? "started" : "stopped";
                await statusRef.set({
                    isRunning,
                });
                 console.log("Minecraft running status updated to "+isRunning);
                resolve(isRunning);
            } catch (error) {
                console.error('Error updating Firestore:', error);
                reject(error);
            }
        });
    });
}


async function uploadLogFile() {
	let isRunning = await checkMinecraft();
    if (isRunning) {
		try
		{
		const logFile = fs.readFileSync(logFilePath, 'utf-8');
		 const formattedLogFile = logFile.replace(/\r?\n/g, '\n');
            logRef.update({ formattedLogFile }, (error) => {
                if (error) {
                    console.error('Error uploading log file:', error);
                } else {
                    console.log('Log file uploaded successfully.');
                }
            });
		}
		catch
		{
			console.log("log upload was failed.. continuing");
		}
        
    }
}

async function uploadPropertiesFile() {
	let isRunning = await checkMinecraft();
    if (isRunning) {
		try
		{
		const propertyFile = fs.readFileSync(PropertyPath, 'utf-8');
		const formattedPropertyFile = propertyFile.replace(/\r?\n/g, '\n');
            propertyRef.update({ formattedPropertyFile }, (error) => {
                if (error) {
                    console.error('Error uploading log file:', error);
                } else {
                    console.log('Property file uploaded successfully.');
                }
            });
          
        
		}
		catch(error)
		{
			console.log("Property File upload was failed.. continuing ", error);
		}
        
    }
}

async function getActivePlayers() {
    try {
        const response = await rcon.send('list'); // Command to list active players
        const playerList = response.split(': ')[1]; // Extract the player list from the response
        const players = playerList ? playerList.split(', ') : [];
        return players;
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
        await firestore.collection('users').doc(player).update({ playedFor : playtime }, { merge: true });
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
	let isRunning = await checkMinecraft();
    if (isRunning) {
        try {
            // Ensure Rcon is initialized
            if (!rcon) {
                await initRcon();
            }
             const response = await rcon.send("stop");
            
            // Update status to "stopping"
            await serverCmdFeedBack.update({ "status": "stopping" });
            console.log('Server is stopping...');

            const intervalId = setInterval(async () => {
                try {
                    // Check if Minecraft is still running
                    if (!checkMinecraft()) {
                        clearInterval(intervalId);

                        // Update status to "stopped"
                        await serverCmdFeedBack.update({ "status": "stopped" });
                        await logRef.update({ "formattedLogFile": "" });

                        console.log('Server has been stopped');
                        console.log('Log file uploaded successfully.');
                    } else {
                        // Keep updating the status as "stopping"
                        await serverCmdFeedBack.update({ "status": "stopping" });
                        console.log('Server is stopping...');
                    }
                } catch (error) {
                    console.error('Error during server stop interval:', error);
                }
            }, 3000);
        } catch (error) {
            console.error("Error occurred while stopping server:", error);
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


async function fetchData(sparkURL) {
	const start = Date.now();
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .setChromeService(service)
        .build();
	try {
        await driver.get(sparkURL);

        // Wait until the elements are present in the DOM with adjusted timeout
        const wait = driver.wait.bind(driver);

        const infoButton = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[1]/div[3]')), 120000);
        await infoButton.click();
		 // Waiting for the elements to be present
        const tpsElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[1]/div/div[1]/div[1]')), 120000);
        const cpuUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[3]/div/div[1]/div[1]')), 120000);
        const memoryUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[4]/div/div/div[1]/span[1]')), 120000);
        const physicalMemoryElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[6]/div/div/div[1]/span[1]')), 120000);
        const diskUsageElement = await wait(until.elementLocated(By.xpath('//*[@id="__next"]/main/div/div[2]/div[1]/div[8]/div/div/div[1]/span[1]')), 120000);
        

        // Fetching the text
        const tpsText = await tpsElement.getText(); // out of 20
        const cpuUsageText = await cpuUsageElement.getAttribute('innerHTML'); // out of 100%
        const memoryUsageText = await memoryUsageElement.getAttribute('innerHTML');  // out of 6gb
        const physicalMemoryUsage = await physicalMemoryElement.getAttribute('innerHTML');  // out of 8gb
        const diskUsage = await diskUsageElement.getAttribute('innerHTML');  // out of 28gb
        
        
        await serverCpu.update({ "cpu": cpuUsageText});
        await serverMemory.update({ "diskSpace": diskUsage });
        await serverRAM.update({ "memory": memoryUsageText});
        await serverPhyRAM.update({ "physical_memory": physicalMemoryUsage});
        await serverTPS.update({ "tps": tpsText });
        
        console.log("TPS: ", tpsText);
        console.log("CPU Usage: ", cpuUsageText);
        console.log("Memory Usage: ", memoryUsageText);
        console.log("Physical Memory Usage: ", physicalMemoryUsage);
        console.log("Disk Usage: ", diskUsage);
        

    } catch (e) {
        console.error(e);
    } finally {
        // Close the browser
        await driver.quit();
        const end = Date.now();
        console.log("Time taken to fetch data = ", (end - start) / 1000, "seconds");  // Print the time taken to fetch the data
        return;
    }
};

//=====================================================================
//routing commands
app.get("/ping", (req, res) => {
 res.send("OK");
});

app.get("/sync", (req, res) => {
 uploadPropertiesFile();
 res.send("OK");
});

app.get("/stop", async (req, res) => {
	await stopServer();
	res.send("OK");
});

app.get("/start", async (req, res) => {
	await startServer();
	console.log("function called to start");
	res.send("OK");
});

app.post('/log', async (req, res) => {
	const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }
    try {
        if (!rcon) {
            await initRcon();
        }
        const response = await rcon.send(command);
        uploadLogFile();
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({ error: 'Failed to execute command' });
    }
});


//DRIVER FUNCTION=================================================
async function main() {
    let isRconConnected = await initRcon();
    console.log(isRconConnected);
    if (isRconConnected) {
        // await logActivePlayersPlaytime();
        checkMinecraft();
        
        uploadPropertiesFile(); // Upload the properties file
        
		setTimeout(async () => {
            await initRcon();
        }, 6000); // 6 seconds delay

        // Correct usage of setInterval
        setInterval(async () => {
            await checkMinecraft(); // Checks whether Java is running in the background
        }, 5000); // 5 seconds interval
         setInterval(async () => {
            await uploadLogFile(); // Uploads the server log to the RTDB
        }, 10000); // 10 seconds interval

        setInterval(async () => {
            await uploadPropertiesFile(); // Uploads properties file to the RTDB
        }, 30000); // 30 seconds interval

        // Uncomment and use setInterval for other async functions as needed
        // setInterval(async () => {
        //     await logActivePlayersPlaytime();
        // }, 5000);

        // setInterval(async () => {
        //     await sparkStats();
        // }, 60000);
        setTimeout(async () => {
            await sparkStats();
        }, 8000); // 8 seconds delay
        
    } else {
        console.log('Minecraft server is not running or RCON connection failed.');
        
        // Retry RCON connection every 6 seconds if the initial connection fails
        setInterval(async () => {
            await initRcon();
        }, 6000);
    }
}


main();

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});
