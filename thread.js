const { parentPort } = require('worker_threads');

let onGame = false

// Escuchar mensajes del hilo principal
parentPort.on('message', (message) => {
  console.log(`Mensaje del hilo principal: ${message}`);

  if (message == "start-game"){
    onGame = true
    runThread()
  }
});

function runThread(){
    parentPort.postMessage("Hilo FUNCIONANDO1")
    while(onGame){
    setTimeout(() =>{
        parentPort.postMessage("Hilo FUNCIONANDO")
    }, 10);
    }

}