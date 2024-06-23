const express = require("express");
const WebSocket = require('ws');
const db = require("./database.js");
const { Worker } = require('worker_threads');
const email = require("./email.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const host = 'localhost';
const port = 8000;
let verifications = {};
let games = {
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get("/users/:mail", async (req, res) => {
    try {
        const mail = req.params.mail;
        const respuesta = await db.getUserByMail(mail);
        res.status(200).json({ content: JSON.stringify(respuesta) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/send-mail", async (req, res) => {
    try {
        console.log(req.body)
        const { mail } = req.body;
        const code = await email.sendVerificationMail(mail);
        verifications[mail] = code;
        res.status(200).json({ content: "Email Sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/verify-code", (req, res) => {
    try {
        const { mail, code } = req.body;
        if (code == verifications[mail]) {
            res.status(200).json({ content: "Email Verified" });
        } else {
            res.status(400).json({ content: "Incorrect code" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/create-user", (req, res) => {
    try {
        const { mail, akka } = req.body;
        const response = db.createUser(mail, akka);
        res.status(200).json({ content: response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/host-game", async (req, res) => {
    try {
        const identifier = await createUniqueGameID();
        const worker = await createGame(identifier);
        games[identifier.toString()] = {
            host : "",
            worker: worker,
            clients: {}
        };
        res.status(200).json({ content: identifier });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// app.post("/start-game", (req, res) => {
//     try {
//         const { gameID } = req.body;
//         const worker = games[gameID]?.worker;
//         if (worker) {
//             worker.postMessage('start-game');
//             res.status(200).json({ content: "Game started" });
//         } else {
//             res.status(400).json({ content: "Game not found" });
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.post("/join-game", (req, res) => {
    try {
        const { codeRoom, mail, name } = req.body;
        const game = games[codeRoom]["worker"];
        if (game) {
            game.postMessage(`join-game/${mail}/${name}`);
            games[codeRoom].clients[mail] = res;
            res.status(200).json({ content: "Joined" });
        } else {
            res.status(400).json({ content: "No game found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initialize DB and start the server
db.initializeDB();
const server = app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (cliente) => {
    console.log('Nuevo cliente conectado');

    // Manejo de mensajes recibidos
    cliente.on('message', (message) => {
        console.log('Mensaje recibido:', message.toString());

        identifyMessage(message.toString(), cliente)

        // Ejemplo: Eco de vuelta al cliente
        cliente.send(`Eco: ${message}`);
    });

    // Manejo de cierre de conexión
    cliente.on('close', () => {
        console.log('Cliente desconectado');
    });

    cliente.send("hello world!")
});


// Helper functions
async function createGame(identifier) {
    return new Promise((resolve) => {
        const worker = new Worker('./thread.js');
        worker.on('message', (message) => {
            console.log(`Message from worker: ${message}`);
            threadListener(message);
        });
        worker.postMessage(`set-code/${identifier}`);
        worker.on('error', (error) => {
            console.error(`Worker error: ${error}`);
        });
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker exited with code ${code}`);
            } else {
                console.log('Worker finished successfully');
            }
        });
        resolve(worker);
    });
}

function createUniqueGameID() {
    return new Promise((resolve) => {
        let unique = crypto.randomUUID().split("-");
        unique[1] = unique[1].toUpperCase();
        while (games[unique[1]] !== undefined) {
            unique = crypto.randomUUID().split("-");
            unique[1] = unique[1].toUpperCase();
        }
        resolve(unique[1].toUpperCase());
    });
}

function threadListener(message) {
    const parts = message.split("/");
    if (parts[0] === "PlayerUpdated") {
        console.log(JSON.parse(parts[1]));
        let inform = "PlayerUpdated"
        let wb = games[parts[2]]["host"]
        let players = JSON.parse(parts[1])

        Object.keys(players).forEach(clave => {
            inform = inform + "/" + players[clave]["name"]
            console.log(clave); // Imprime la clave
          });
        wb.send(inform)

    }
}

//identify messages from webSocket with client
function identifyMessage(message, cliente){
    let action = message.split("/")[0]

    if(action === "register"){
        let gameCode = message.split("/")[1]
        let mail = message.split("/")[2]

        if(mail === 'host'){

            games[gameCode]["host"] = cliente
            console.log(games)
        }else{
            games[gameCode]["clients"][mail] = cliente
            console.log(games)
        }
    }
    if(action === "start-game"){

        try {
            const gameID = message.split("/")[1];
            console.log(gameID)
            const worker = games[gameID]["worker"];
            const players = games[gameID]["clients"];
            console.log("PLAEYRS:", players)
            if (worker) {
                worker.postMessage('start-game');
                Object.keys(players).forEach(clave => {
                    players[clave].send("set-screen/showRole")
                    console.log(clave); // Imprime la clave
                  });
                  games[gameID]["host"].send("roles-shown")
            }
        } catch (error) {
            console.log(error)
        }

    }

}