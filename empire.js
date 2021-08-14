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

  gameSocket.on('gameStatus', (gameId) => {
    console.log("got request for game status for game id", gameId);
    transmitGameStatus(gameId, gameSocket);
  })

  gameSocket.on('getTile', () => assignTileToPlayer(gameSocket));

  gameSocket.on('chat', (msg) => {
    transmitChat(msg, gameSocket);
  })
}

function transmitGameStatus(gameId, gameSocket) {
  console.log("transmitting game status from server", gameId);
  console.log("gameId type", typeof gameId);
  const game = games[gameId];
  io.to(gameId).emit('gameStatus', game);
}

function transmitChat(msg, gameSocket) {
  console.log("sending msg from " + gameSocket.id + ": " + msg);
  console.log(games);
  //io.emit('chat', { name: gameSocket.id, msg: msg });
  // gameID is not defined! How do we know what game ID this is? Can the client tell the server?
  io.to(msg.gameId).emit('chat', { name: games[msg.gameId].players[gameSocket.id].name, msg: msg.msg });
}

function createNewGame(playerName, gameSocket) {
  console.log(playerName);
  const gameId = ((Math.random() * 10000) | 0).toString();

  let game = {};
  game.id = gameId;
  game.players = {};
  game.players[gameSocket.id] = {};
  game.players[gameSocket.id].name = playerName;
  games[game.id] = game;
  console.log("new game", games);

  gameSocket.join(gameId);
  io.to(gameId).emit('startNewGame', { gameId: gameId, userId: gameSocket.id });
}

function joinExistingGame(playerName, existingGameId, gameSocket) {
  console.log(`${playerName} is joining game ${existingGameId}`);
  gameSocket.join(existingGameId);

  games[existingGameId].players[gameSocket.id] = { name: playerName };
  console.log("join existing game", games);

  io.to(existingGameId).emit('joinExistingGame', `${playerName} joined the game!`);
  transmitGameStatus(existingGameId);
}


function assignTileToPlayer(gameSocket) {
  console.log("Assigning a tile...");
}