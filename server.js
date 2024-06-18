const db = require("./database.js");
const email = require("./email.js");
const http = require("http");
const host = 'localhost';
const port = 8000;

let dbMemo = db.openInMemoryDatabase()
let code = ""

const requestListener = async function (req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2592000, // 30 days
        'Content-Type': 'application/json'
        /** add other headers as per requirement */
    };

    let response = ""

    if (req["method"] == "GET") {
        response = await identifyReqGET(req["url"])
    }
    if (req["method"] == "POST") {
        let body = await parseJSONBody(req);

        response = await identifyReqPOST(req["url"], body)
    }
    // console.log(req)

    res.writeHead(200, headers);

    res.end(JSON.stringify(response));
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
            resolve(respuesta)
        }


    })

}

function identifyReqPOST(req, body) {
    return new Promise(async (resolve) => {
        req = req.split("/")

        console.log("REQUEST POST", req)
        if (req[1] == "send-mail") {
            // console.log("SEND MAIL", body, body["mail"])
            code = await email.sendVerificationMail(body["mail"])
            console.log(code)
            // db.createUserVerification(body["mail"], code , dbMemo);
            resolve("Email Sended")
        }
        if (body["code"] && req[1] == "verify-code") {
            // console.log("VERIFY CODE")
            let verified = email.verifyCode(req[2])
            if (verified) {
                resolve("Email Verified")
            } else {
                resolve("Incorrect Code")
            }
        }
        if (req[1] == "create-user") {
            // console.log("CREATE USER", body)
            let response = db.createUser(body["mail"], body["akka"])
            resolve(response)
        }


    })

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