var io;
var games = {};

exports.initGame = function (socketIo, socket) {
  io = socketIo;
  var gameSocket = socket;
  gameSocket.emit('connected', { message: 'You are connected!' });

  gameSocket.on('createNewGame', (playerName) => {
    console.log("got createNewGame");
    createNewGame(playerName, gameSocket);
  });

  gameSocket.on('joinExistingGame', (playerName, existingGameId) => {
    console.log("Got joinExistingGame");
    joinExistingGame(playerName, existingGameId, gameSocket);
  })

  gameSocket.on('getTile', () => assignTileToPlayer(gameSocket));

  gameSocket.on('chat', (msg) => {
    transmitChat(msg, gameSocket);
  })
}

function transmitChat(msg, gameSocket) {
  console.log("sending msg from " + gameSocket.id + ": " + msg);
  console.log(games);
  io.emit('chat', { name: gameSocket.id, msg: msg });
  // gameID is not defined! How do we know what game ID this is? Can the client tell the server?
  //io.in(gameId).emit('chat', { name: games[gameId].players[gameSocket.id].name, msg: msg });
}

function createNewGame(playerName, gameSocket) {
  console.log(playerName);
  gameId = (Math.random() * 10000) | 0;

  let game = {};
  game.id = gameId.toString();
  game.players = { [gameSocket.id]: { name: playerName } }
  games[game.id] = game;
  console.log("new game", games);

  io.emit('startNewGame', { gameId: gameId, userId: gameSocket.id });
  gameSocket.join(gameId.toString());
}

function joinExistingGame(playerName, existingGameId, gameSocket) {
  console.log(`${playerName} is joining game ${existingGameId}`);
  gameSocket.join(existingGameId);

  games[existingGameId].players[gameSocket.id] = { name: playerName };
  console.log("join existing game", games);

  io.emit('joinExistingGame', `${playerName} joined the game!`);
}


function assignTileToPlayer(gameSocket) {
  console.log("Assigning a tile...");
}