const { parentPort } = require('worker_threads');

let onGame = false
let players = {}
let codeRoom

// Escuchar mensajes del hilo principal
parentPort.on('message', (message) => {
  console.log(`Mensaje del hilo principal: ${message}`);

  message = message.split("/")

  if (message[0] == "start-game"){
    onGame = true
    runThread()
  }

  if (message[0] == "join-game"){
    
    addPlayer(message[2], message[1])
    
  }

  if (message[0] == "set-code"){
    
    setCode(message[1])
    
  }
});

function addPlayer(name, mail){

  if(players[mail] === undefined){
    let player = {
      "name": name,
      "role":"",
      "alive":true
    }
  
    players[mail] = player;
  
    parentPort.postMessage(`PlayerUpdated/${JSON.stringify(players)}/${codeRoom}`)

  }


}

function setCode(code){

  codeRoom = code

}

function runThread(){
    parentPort.postMessage("Hilo FUNCIONANDO1")
}