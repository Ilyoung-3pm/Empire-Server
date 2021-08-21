const { initializeGame, calculateDistanceTo1A } = require('./GameService.js');

var io;
var games = {}; // keys -> id, players: {id: { name, tiles: [], cash: 6000 }}, activePlayer: id, board: { 1-A: null, 2-C: 'Wingspan' }

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
  });

  gameSocket.on('gameStatus', (gameId) => {
    console.log("got request for game status for game id", gameId);
    transmitGameStatus(gameId, gameSocket);
  });

  gameSocket.on('startGame', (gameId) => {
    startGame(gameId);
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
  console.log("sending msg from " + gameSocket.id + ": " + msg.msg);
  io.to(msg.gameId).emit('chat', { name: games[msg.gameId].players[gameSocket.id].name, msg: msg.msg });
}

function createNewGame(playerName, gameSocket) {
  console.log(playerName);
  const gameId = ((Math.random() * 10000) | 0).toString();

  let game = {};
  game.id = gameId;
  game.players = {};
  game.players[gameSocket.id] = { host: true };
  game.players[gameSocket.id].name = playerName;

  games[game.id] = game;
  console.log("new game", games);

  gameSocket.join(gameId);
  io.to(gameId).emit('startNewGame', { gameId: gameId, userId: gameSocket.id });
  io.to(gameId).emit('log', `${playerName} has joined the game.`);
}

function joinExistingGame(playerName, existingGameId, gameSocket) {
  console.log(`${playerName} is joining game ${existingGameId}`);
  if (games[existingGameId]) {
    const game = games[existingGameId];
    // TODO verify the game has not already started. Verify the game does not have more than 4 players.
    gameSocket.join(existingGameId);
    //games[existingGameId].players[gameSocket.id] = { name: playerName };
    game.players[gameSocket.id] = { name: playerName };
    io.to(existingGameId).emit('joinExistingGame', `${playerName} joined the game!`);
    io.to(existingGameId).emit('log', `${playerName} has joined the game.`);

    // When a player joins the game, let them know who else is in the game.
    Object.keys(games[existingGameId].players).forEach((playerId) => {
      if (playerId != gameSocket.id) {
        io.to(gameSocket.id).emit('log', `${game.players[playerId].name} is in the game.`);
      }
    })
    games[existingGameId] = game;
    transmitGameStatus(existingGameId);
    console.log("join existing game", games);
  } else {
    // TODO Handle errors if game does not exist, has already started, has max number of players.
  }
}

function startGame(gameId) {
  io.to(gameId).emit('startGame', true);
  io.to(gameId).emit('log', "The game has started!");

  const game = initializeGame(games[gameId]);
  //games[gameId] = updatedGame;

  // Assign the first tile and determine the first player.
  let firstPlayer;
  Object.keys(game.players).forEach((playerId) => {
    const tile = game.tiles.pop();
    game.board[tile] = null;
    if (!firstPlayer) {
      firstPlayer = { id: playerId, distance: calculateDistanceTo1A(tile) }
    } else {
      const distance = calculateDistanceTo1A(tile);
      // TODO determine if tile is adjacent to another first tile....damn.
      if (distance < firstPlayer.distance) {
        firstPlayer = { id: playerId, distance: distance }
      }
    }

    const playerName = game.players[playerId].name;
    game.players[playerId].tiles = [tile];
    io.to(gameId).emit('log', `${playerName}'s picked ${tile}`);
  });

  io.to(gameId).emit('board', game.board);

  game.activePlayer = firstPlayer.id;
  // Nice TODO If playerId = socketId, emit player name to everyone BUT player. Emit "You go first" to socketId.
  io.to(gameId).emit('log', `${game.players[firstPlayer.id].name} was closest to 1-A. They go first.`);
  io.to(gameId).emit('activePlayer', firstPlayer.id);

  //Put tiles on the board.
  //TODO Pop tiles from each players .tiles and assign to board?

  // Assign 6 tiles to each player.
  Object.keys(game.players).forEach((playerId) => {
    const player = game.players[playerId]
    let tiles = [];
    while (tiles.length < 6) {
      tiles.push(game.tiles.pop());
    }
    player.tiles = tiles;
    game.players[playerId] = player;
    io.to(playerId).emit('playerStatus', player);
  })

  // Set active player to first player.

  // Let players know what they have...
  // Object.keys(updatedGame.players).forEach((playerId) => {
  //   const playerStatus = updatedGame.players[playerId];
  //   console.log(`Emitting status to player ${playerId}`, playerStatus);
  //   io.to(playerId).emit('playerStatus', playerStatus);
  // });
  games[gameId] = game;
}

function assignTileToPlayer(playerId, gameId) {
  console.log("Assigning a tile...");
  // const game = games[gameId];
  // const tile = game.tiles.pop();
  // player.tiles = [firstTile];
  // game.players[playerId] = player;

}