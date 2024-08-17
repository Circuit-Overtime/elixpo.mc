window.onload = () => {
    globalThis.gameStatus = "";
    globalThis.scriptStatus = "";
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
const db = firebase.firestore();
const rtdb = firebase.database();
const logRef = rtdb.ref('serverLogs/log');
const propertyRef = rtdb.ref('serverLogs/property');
const serverFeedBack = rtdb.ref('serverLogs/feedback');

const serverStatsCPU = rtdb.ref('serverStats/cpu');
const serverStatsDisk = rtdb.ref('serverStats/diskSpace');
const serverStatsRAM= rtdb.ref('serverStats/memory');
const serverStatsPhy_RAM = rtdb.ref('serverStats/physical_memory');
const serverStatsTPS = rtdb.ref('serverStats/tps');


serverStatsCPU.on('value', (snapshot) => {
    document.getElementById("serverCPUText").innerHTML = snapshot.val() + " / 100%";
});
serverStatsDisk.on('value', (snapshot) => {
    document.getElementById("serverDiskText").innerHTML = snapshot.val() + " / 28 GB";
});
serverStatsRAM.on('value', (snapshot) => {
    document.getElementById("softwareRAMText").innerHTML = snapshot.val() + " /6.0 GB";
});
serverStatsPhy_RAM.on('value', (snapshot) => {
    document.getElementById("softwareRAMPhysicalText").innerHTML = snapshot.val() + " / 8.0 GB";
});
serverStatsTPS.on('value', (snapshot) => {
    document.getElementById("softwareTPSText").innerHTML = "TPS: " + snapshot.val();
});

serverStatsCPU.on('child_changed', (snapshot) => {
    document.getElementById("serverCPUText").innerHTML = snapshot.val() + " / 100%";
});
serverStatsDisk.on('child_changed', (snapshot) => {
    document.getElementById("serverDiskText").innerHTML = snapshot.val() + " / 28 GB";
});
serverStatsRAM.on('child_changed', (snapshot) => {
    document.getElementById("softwareRAMText").innerHTML = snapshot.val() + " /6.0 GB";
});
serverStatsPhy_RAM.on('child_changed', (snapshot) => {
    document.getElementById("softwareRAMPhysicalText").innerHTML = snapshot.val() + " / 8.0 GB";
});
serverStatsTPS.on('child_changed', (snapshot) => {
    document.getElementById("softwareTPSText").innerHTML = "TPS: " + snapshot.val();
});


logRef.on('value', (snapshot) => {
    const consoleOutput = document.getElementById('consoleZone');
    consoleOutput.innerHTML = ''; // Clear the console

    snapshot.forEach((childSnapshot) => {
        const logData = childSnapshot.val();
        consoleOutput.innerHTML += logData + '\n';
    });

    // Scroll to the bottom of the console
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
});


logRef.on('child_changed', (snapshot) => {
    const consoleOutput = document.getElementById('consoleZone');
    consoleOutput.innerHTML = ''; // Clear the console

    snapshot.forEach((childSnapshot) => {
        const logData = childSnapshot.val();
        consoleOutput.innerHTML += logData + '\n';
    });

    // Scroll to the bottom of the console
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
});


propertyRef.on('value', (snapshot) => {
    const propertyOutput = document.getElementById('propetiesPannel');
    propertyOutput.innerHTML = ''; // Clear the console

    snapshot.forEach((childSnapshot) => {
        const propertyData = childSnapshot.val();
        propertyOutput.innerHTML += propertyData + '\n';
    });

    // Scroll to the bottom of the console
    propertyOutput.scrollTop = propertyOutput.scrollHeight;
});


propertyRef.on('child_changed', (snapshot) => {
    const propertyOutput = document.getElementById('propetiesPannel');
    propertyOutput.innerHTML = ''; // Clear the console

    snapshot.forEach((childSnapshot) => {
        const propertyData = childSnapshot.val();
        propertyOutput.innerHTML += propertyData + '\n';
    });

    // Scroll to the bottom of the console
    propertyOutput.scrollTop = propertyOutput.scrollHeight;
});


serverFeedBack.on('value', (snapshot) => {
    let serverFeedBackStatus = "";
    snapshot.forEach((childSnapshot) => {
        serverFeedBackStatus = childSnapshot.val();
        console.log('Feedback:', serverFeedBackStatus);
    }); 
    if(serverFeedBackStatus == "stopped")
    {
        document.getElementById("serverStatusText").innerText = "Offline";
        document.getElementById("serverStatusIcon").setAttribute("name", "stop-circle");
        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
        document.getElementById("startButtonSection").style.display = "block";   
    }
    else if(serverFeedBackStatus == "stopping")
    {
        document.getElementById("serverStatusText").innerText = "Stopping";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, #969393, #fff5f5, #8c8a8a)"
        document.getElementById("serverStatusIcon").setAttribute("name", "cog");

        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
        
    }
    else if(serverFeedBackStatus == "starting")
    {
        document.getElementById("serverStatusText").innerText = "Starting";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, #969393, #fff5f5, #8c8a8a)"
        document.getElementById("serverStatusIcon").setAttribute("name", "cog");
        
        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
    }
    else if(serverFeedBackStatus == "started")
    {
        document.getElementById("serverStatusText").innerText = "Started";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, rgba(34, 193, 195, 0.5), rgba(45, 253, 149, 0.5))"
        document.getElementById("serverStatusIcon").setAttribute("name", "play");
        
        document.getElementById("stopButtonSection").style.display = "block"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "all";
        document.getElementById("sparkStats").style.filter = "blur(0px)";
    }
});


serverFeedBack.on('child_changed', (snapshot) => {
    let serverFeedBackStatus = "";
    snapshot.forEach((childSnapshot) => {
        serverFeedBackStatus = childSnapshot.val();
        console.log('Feedback:', serverFeedBackStatus);
    }); 
    if(serverFeedBackStatus == "stopped")
    {
        document.getElementById("serverStatusText").innerText = "Offline";
        document.getElementById("serverStatusIcon").setAttribute("name", "stop-circle");
        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
        document.getElementById("startButtonSection").style.display = "block";   
    }
    else if(serverFeedBackStatus == "stopping")
    {
        document.getElementById("serverStatusText").innerText = "Stopping";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, #969393, #fff5f5, #8c8a8a)"
        document.getElementById("serverStatusIcon").setAttribute("name", "cog");

        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
        
    }
    else if(serverFeedBackStatus == "starting")
    {
        document.getElementById("serverStatusText").innerText = "Starting";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, #969393, #fff5f5, #8c8a8a)"
        document.getElementById("serverStatusIcon").setAttribute("name", "cog");
        
        document.getElementById("stopButtonSection").style.display = "none"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "none";
        document.getElementById("sparkStats").style.filter = "blur(10px)";
    }
    else if(serverFeedBackStatus == "started")
    {
        document.getElementById("serverStatusText").innerText = "Started";
        document.getElementById("statusBar").style.background = "linear-gradient(135deg, rgba(34, 193, 195, 0.5), rgba(45, 253, 149, 0.5))"
        document.getElementById("serverStatusIcon").setAttribute("name", "play");
        
        document.getElementById("stopButtonSection").style.display = "block"; 
        document.getElementById("startButtonSection").style.display = "none"; 

        document.getElementById("consoleInput").style.pointerEvents = "all";
        document.getElementById("sparkStats").style.filter = "blur(0px)";
    }
});


async function fetchServerStatus() {
    try {
        db.collection('minecraftStatus').doc('status').onSnapshot((doc) => {
            const data = doc.data();
            globalThis.gameStatus = data.isRunning;
            // console.log('Game Status:', globalThis.gameStatus);
        }); 
    } catch (error) {
        console.error('Error fetching server status:', error);
        globalThis.gameStatus = 'offline';
    }
}

async function pingScript() {
    try {
        const response = await fetch('http://10.42.0.67:3003/ping');
        const data = await response;
        // console.log('Start Server Response:', data.statusText);
        if(data.statusText == 'OK') {
            globalThis.scriptStatus = 'online';
        } else {
            globalThis.scriptStatus = 'offline';
        }
        // Optionally, update the UI to show start status

    } catch (error) {
        console.error('Error starting server:', error);
        globalThis.scriptStatus = 'offline';
    }
}


async function stopServer() {
    console.log('Stopping server...');
    try {
        const response = await fetch('http://10.42.0.67:3003/stop');
        const data = await response;
        if(data.statusText == 'OK') {
            console.log('server stopped...');
            globalThis.gameStatus = 'offline';
        } else {
            globalThis.gameStatus = 'online';
        }
        // Optionally, update the UI to show start status

    } catch (error) {
        console.error('Error starting server:', error);
        globalThis.gameStatus = 'online';
    }
}


async function startServer() {
    console.log('Starting server...');
    try {
        const response = await fetch('http://10.42.0.67:3003/start');
        const data = await response;
        if(data.statusText == 'OK') {
            console.log('server starting...');
            // globalThis.gameStatus = 'online';
        } else {
            // globalThis.gameStatus = 'offline';
        }
        // Optionally, update the UI to show start status

    } catch (error) {
        console.error('Error starting server:', error);
        globalThis.gameStatus = 'offline';
    }
}


document.getElementById('stopServer').addEventListener('click', stopServer);
document.getElementById('startServer').addEventListener('click', startServer);



async function sendCommand(cmd) {
    try {
        const response = await fetch('http://10.42.0.67:3003/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command: cmd })
        });
        const data = await response.json();
        console.log('Command response:', data);
    } catch (error) {
        console.error('Error sending command:', error);
    }
}


document.getElementById("consoleInput").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        let cmdSend = document.getElementById("consoleInput").value;
        if (cmdSend.trim().length > 0) {
            sendCommand(cmdSend);
        }
        document.getElementById("consoleInput").value = '';
    }
});

setInterval(fetchServerStatus, 5000); 
setInterval(() => {
    pingScript();
}, 1200);

