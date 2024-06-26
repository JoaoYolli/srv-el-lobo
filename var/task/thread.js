const { parentPort } = require('worker_threads');

let onGame = false
let players = {}
let codeRoom

let roles = []


// Escuchar mensajes del hilo principal
parentPort.on('message', (message) => {
  console.log(`Mensaje del hilo principal: ${message}`);

  let parts = []
  parts = message.split("/")
  console.log("PARTS", parts)

  if (parts[0] == "host-disconnected") {

    self.close()

  }

  if (parts[0] == "start-game") {
    onGame = true
    let setRoles = []
    for(let i = 1;i<parts.length;i++){
      setRoles.push(parts[i])
    }
    console.log(setRoles)
    startGame(setRoles)
  }

  if (parts[0] == "join-game") {

    addPlayer(parts[2], parts[1])

  }

  if (parts[0] == "leave-game") {

    removePlayer(parts[1])

  }

  if (parts[0] == "set-code") {

    setCode(parts[1])

  }
});

function addPlayer(name, mail) {

  if (players[mail] === undefined) {
    let player = {
      "name": name,
      "role": "",
      "alive": true
    }

    players[mail] = player;

    parentPort.postMessage(`PlayerUpdated/${JSON.stringify(players)}/${codeRoom}`)

  }


}

function removePlayer(mail) {

  delete players[mail]
  parentPort.postMessage(`PlayerUpdated/${JSON.stringify(players)}/${codeRoom}`)

}

function setCode(code) {

  codeRoom = code

}

function startGame(message) {

  console.log(message)

  let roles = new Array();

  for (let i = 0; i < message.length; i++) {
    roles.push(message[i])
  }
  console.log(roles)

  roles = shuffleArray(roles)
  let index = 0
  Object.keys(players).forEach(clave => {
    players[clave]["role"] = roles[index]
    parentPort.postMessage(`showRole/${clave}/${roles[index]}/${codeRoom}`)
    console.log(clave); // Imprime la clave
    index++;
  });

  parentPort.postMessage(`roles-shown/${codeRoom}`)

}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Intercambia elementos
  }
  return array;
}
