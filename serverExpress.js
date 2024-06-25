const express = require("express");
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const db = require("./database.js");
const { Worker } = require('worker_threads');
const email = require("./email.js");
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const host = 'localhost';
const port = process.env.PORT;
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
        let user = await db.getUserByMail(mail)
        if (user === undefined){
            user = {"akka":""}
        }
        verifications[mail] = code;
        res.status(200).json({ content: user["akka"] });
    } catch (error) {
        console.log(error)
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
        // console.log("PARAMETERRES",req)
        const token = generateAccessToken(akka, mail)
        res.status(200).json({ "token": token});
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
});

app.post("/check-token", async (req, res) => {
    try {
        const { token } = req.body;
        let decoded = await verifyAccessToken(token)
        // console.log(decoded["data"]["id"])
        res.status(200).json({ "userName": decoded["data"]["id"], "userMail":decoded["data"]["email"]});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/host-game", async (req, res) => {
    try {
        const identifier = await createUniqueGameID();
        const worker = await createGame(identifier);
        games[identifier.toString()] = {
            host: "",
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
db.createUser("yoaojoao@gmail.com", "Joao");
const server = app.listen(port, /*host,*/ () => {
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
        checkConnection(cliente)
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

//checks who have disconnected
async function checkConnection(clienteD) {

    Object.keys(games).forEach(clave => {
        let game = games[clave]
        let jugadores = game["clients"]
        //checks if the host is the one who disconnected
        if (game["host"] == clienteD) {
            //Closes the thread and inform the clients about the host
            game["worker"].postMessage("host-disconnected")
            Object.keys(jugadores).forEach(clave2 => {

                jugadores[clave2].send("host-disconnected")

            });

            delete games[clave]

            console.log("GAMES", games)

        } else {//Means a player have disconnected
            Object.keys(jugadores).forEach(clave2 => {
                //When founded removes the client from the ones saved
                if (jugadores[clave2] == clienteD) {

                    // console.log("KEYY",clave2)

                    game["worker"].postMessage(`leave-game/${clave2}`)
                    delete jugadores[clave2]

                    // console.log("CLIENTES",jugadores)

                }

            });
        }
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
    if(parts[0] === "showRole"){
        let player = games[parts[3]]["clients"][parts[1]]
        player.send(`set-screen/showRole/${parts[2]}`)
    }

    if(parts[0] === "roles-shown"){
        let host = games[parts[1]]["host"]
        host.send(`"roles-shown"`)
    }
}

//identify messages from webSocket with client
function identifyMessage(message, cliente) {
    let action = message.split("/")[0]

    if (action === "register") {
        let gameCode = message.split("/")[1]
        let mail = message.split("/")[2]

        if (mail === 'host') {

            games[gameCode]["host"] = cliente
            console.log(games)
        } else {
            games[gameCode]["clients"][mail] = cliente
            console.log(games)
        }
    }
    if (action === "start-game") {

        try {
            const gameID = message.split("/")[1];
            console.log(gameID)
            const worker = games[gameID]["worker"];
            const players = games[gameID]["clients"];
            const cantidadRegistros = Object.keys(players).length;
            //Lo comentado 1 vez se tiene que descomentar al final
            // if (cantidadRegistros >= 4) {
                console.log("PLAEYRS:", players)
                if (worker) {
                    let toSend = 'start-game'
                    let p = message.split("/")
                    for (let i = 2; i < p.length; i++) {
                        toSend += "/"+ p[i]
                      }
                    worker.postMessage(toSend);
                    // // // Object.keys(players).forEach(clave => {
                    // // //     players[clave].send("set-screen/showRole")
                    // // //     console.log(clave); // Imprime la clave
                    // // // });
                    // // // games[gameID]["host"].send("roles-shown")
                }

            // } else {
            //     games[gameID]["host"].send("need-more-players")
            // }

        } catch (error) {
            console.log(error)
        }

    }

}

function generateAccessToken(name, mail) {
    const payload = { id: name, 
                    email: mail }

                    console.log(payload)

    const secret = process.env.JWT_KEY;
    const options = { expiresIn: '1h' };

    return jwt.sign(payload, secret, options);
}

function verifyAccessToken(token) {
    return new Promise((resolve) => {

        const secret = process.env.JWT_KEY;

    try {
        const decoded = jwt.verify(token, secret);
        resolve({ success: true, data: decoded });
    } catch (error) {
        resolve({ success: false, error: error.message });
    }

    })
    
}