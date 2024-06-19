const db = require("./database.js");
const { Worker } = require('worker_threads');
const email = require("./email.js");
const http = require("http");
const host = 'localhost';
const port = 8000;

let verifications = {}
let games = {}

const requestListener = async function (req, res) {
    try {
        const headers = {
            'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
            'Access-Control-Request-Method': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': 2592000, // 30 days
            'Content-Type': '*'
            /** add other headers as per requirement */
        };

        let response = ""

        console.log(req["method"])

        if (req["method"] == "GET") {
            response = await identifyReqGET(req["url"])
        }
        if (req["method"] == "POST") {
            let body = await parseJSONBody(req);

            console.log(body)

            response = await identifyReqPOST(req["url"], body)
        }
        console.log("RESPUESTA ", response)

        res.writeHead(response["code"], headers);

        res.end(JSON.stringify(response["response"]));

    } catch (error) {
        console.log(error)
    }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    db.initializeDB()
    console.log(`Server is running on http://${host}:${port}`);
});

function identifyReqGET(req) {
    return new Promise(async (resolve) => {
        console.log("GET");
        req = req.split("/")
        console.log(req)
        if (req[1] == "users") {
            let respuesta = await db.getUserByMail(req[2])
            console.log("RESPUESTA :", respuesta)
            resolve({ "response": JSON.stringify(respuesta), "code": 200 })
        }


    })

}

function identifyReqPOST(req, body) {
    return new Promise(async (resolve) => {
        req = req.split("/")

        console.log("REQUEST POST", req)
        if (req[1] == "send-mail") {
            // console.log("SEND MAIL", body, body["mail"])
            let code = await email.sendVerificationMail(body["mail"])
            verifications[body["mail"]] = code
            console.log(verifications)
            resolve({ "response": "Email Sended", "code": 200 })
        }
        if (req[1] == "verify-code") {
            // console.log("VERIFY CODE")
            if (body["code"] == verifications[body["mail"]]) {
                resolve({ "response": "Email Verified", "code": 200 })
            } else {
                resolve({ "response": "Incorrect code", "code": 400 })
            }
        }
        if (req[1] == "create-user") {
            // console.log("CREATE USER", body)
            let response = db.createUser(body["mail"], body["akka"])
            resolve({ "response": response, "code": 200 })
        }
        if (req[1] == "host-game") {
            // console.log("CREATE USER", body)
            let identifier = await createUniqueGameID();
            let worker = await createGame()
            games[identifier] = worker;

            resolve({ "response": identifier, "code": 200 })
        }
        if (req[1] == "start-game") {
            // console.log("CREATE USER", body)
            let worker = games[body["gameID"]]
            worker.postMessage('start-game');

            resolve({ "response": "Game started", "code": 200 })
        }


    });

}

function parseJSONBody(req) {
    return new Promise((resolve) => {
        let body = []
        req
            .on('data', chunk => {
                body.push(chunk);
            })
            .on('end', () => {
                // console.log(JSON.parse(Buffer.concat(body).toString()))
                body = JSON.parse(Buffer.concat(body).toString());
                resolve(body)
                // at this point, `body` has the entire request body stored in it as a string
                // console.log(body)
            });

    })

}

async function createGame() {
    return new Promise((resolve) => {

        let worker = new Worker('./thread.js');

        // Escuchar mensajes del worker
        worker.on('message', (message) => {
            console.log(`Mensaje del worker: ${message}`);
        });

        // Enviar un mensaje al worker
        worker.postMessage('Hola, worker!');

        // Manejar errores del worker
        worker.on('error', (error) => {
            console.error(`Error del worker: ${error}`);
        });

        // Detectar cuando el worker termina
        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker finalizado con el código ${code}`);
            } else {
                console.log('Worker terminado exitosamente');
            }
        });

        resolve(worker)

    })

}
function createUniqueGameID(){
    return new Promise((resolve) => {
        let unique = crypto.randomUUID().replace("-","");
        console.log(unique)
        while(games[unique] !== undefined){
            unique = crypto.randomUUID().replace("-","");
            console.log(unique)
        }
        resolve(unique);

    })
}
