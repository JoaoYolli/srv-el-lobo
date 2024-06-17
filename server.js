const http = require("http");
const host = 'localhost';
const port = 8000;

const requestListener = function (req, res) {
    console.log(req)
    identifyReq(req["url"], req["method"])
    res.writeHead(200);
    res.end("My first server!");
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

function identifyReq(req, type){

    if(type == "GET"){
        console.log("GET");
        if(req == "/users"){
            console.log("USERS");
        }
    }
    if(type == "POST"){
        console.log("POST");
        if(req == "/users"){
            console.log("USERS");
        }
    }

}