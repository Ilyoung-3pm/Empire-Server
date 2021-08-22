const { initializeGame, calculateDistanceTo1A, getAdjacentTiles, getAdjacentTilesOnBoard, shuffleTiles, getEmpiresByAdjacentTiles, getAvailableEmpires, getAvailableEmpiresWithAssets } = require('./GameService.js');

var io;
var games = {}; // keys -> id, players: {id: { name, tiles: [], cash: 6000, assets: { Wingspan: 2 } }}, activePlayer: id, board: { 1-A: null, 2-C: 'Wingspan' }

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
    transmitGameStatus(gameId);
  });

  gameSocket.on('startGame', (gameId) => {
    console.log("starting game!");
    startGame(gameId);
  });

  gameSocket.on('playTile', (gameId, tile) => {
    console.log("A player played a tile");
    playTile(tile, gameId, gameSocket.id);
  });

  gameSocket.on('selectedEmpire', (gameId, empire) => {
    addEmpireToBoard(gameId, empire, gameSocket.id);
  })

  //gameSocket.on('getTile', () => assignTileToPlayer(gameSocket));

  gameSocket.on('chat', (msg) => {
    transmitChat(msg, gameSocket);
  })
}

/* Passes all game data to players in the game, except all player's holdings. */
function transmitGameStatus(gameId) {
  console.log("transmitting game status from server", gameId);
  // Deep copy!
  let game = JSON.parse(JSON.stringify(games[gameId]));

  // Remove keys we don't want players to spy on, like other player's cash and tiles.
  Object.keys(game.players).forEach((playerId) => {
    delete game.players[playerId].tiles;
    delete game.players[playerId].cash;
    delete game.players[playerId].assets;
  })

  io.to(gameId).emit('gameStatus', game);
}

function transmitChat(msg, gameSocket) {
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
    //games[existingGameId] = game;
    transmitGameStatus(existingGameId);
    console.log("join existing game", games);
  } else {
    // TODO Handle errors if game does not exist, has already started, has max number of players.
  }
}

function startGame(gameId) {
  io.to(gameId).emit('startGame', true);
  io.to(gameId).emit('log', "The game has started!");
  let game = games[gameId];
  game = initializeGame(game);

  // Assign the first tile and determine the first player.
  let firstPlayer;
  Object.keys(game.players).forEach((playerId) => {
    let tile = game.tiles.pop();
    let validTile = false;
    while (!validTile) {
      // Verify no empires are created when playing the first tile.
      const adjacentTilesOnBoard = getAdjacentTilesOnBoard(tile, game.board);
      if (adjacentTilesOnBoard.length === 0) {
        validTile = true;
      } else {
        game.tiles.push(tile);
        game.tiles = shuffleTiles(game.tiles);
        tile = game.tiles.pop();
      }
    }

    game.board[tile] = null;
    if (!firstPlayer) {
      firstPlayer = { id: playerId, distance: calculateDistanceTo1A(tile) }
    } else {
      const distance = calculateDistanceTo1A(tile);
      if (distance < firstPlayer.distance) {
        firstPlayer = { id: playerId, distance: distance }
      }
    }

    const playerName = game.players[playerId].name;
    game.players[playerId].tiles.add(tile);
    io.to(gameId).emit('log', `${playerName}'s picked ${tile}`);
  });

  game.activePlayer = firstPlayer.id;
  // Nice TODO If playerId = socketId, emit player name to everyone BUT player. Emit "You go first" to socketId.
  io.to(gameId).emit('log', `${game.players[firstPlayer.id].name} was closest to 1-A. They go first.`);

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

  //games[gameId] = game;
  transmitGameStatus(gameId);
}

function assignTileToPlayer(playerId, gameId) {
  console.log("Assigning a tile...");

  // TODO ensure tile is not a dead tile.

  const game = games[gameId];
  const tile = game.tiles.pop();
  game.players[playerId].tiles.push(tile);
  io.to(playerId).emit('playerStatus', game.players[playerId]);
}

function playTile(tile, gameId, playerId) {
  let game = games[gameId];
  const playerName = game.players[playerId].name;

  // Remove tile from player tiles.
  let playerTiles = new Set(game.players[playerId].tiles);
  playerTiles.delete(tile);
  game.players[playerId].tiles = Array.from(playerTiles);
  io.to(gameId).emit('log', `${playerName} placed ${tile} on the board.`);
  io.to(playerId).emit('playerStatus', game.players[playerId]);
  // Add tile to board.
  game.board[tile] = null;
  game.lastPlayedTile = tile;

  /* Determine what the tile does...*/
  // Are there any adjacent tiles on the board?
  const adjacentTilesOnBoard = getAdjacentTilesOnBoard(tile, game.board);

  if (adjacentTilesOnBoard.length > 0) {
    console.log("There were adjacent tiles on the board");
    // Do any adjacent tiles belong to an empire?
    const empiresByAdjacentTiles = getEmpiresByAdjacentTiles(adjacentTilesOnBoard, game.empires);
    console.log("empires by adjacent tiles", empiresByAdjacentTiles);
    if (empiresByAdjacentTiles.size === 1) {
      console.log("There was one adjacent empire");
      // Growing an empire. Any active empires with assets? Time to buy. Otherwise, advance to next player.
      const availableAssetsToBuy = getAvailableEmpiresWithAssets(game.empires);
      if (availableAssetsToBuy.length > 0) {
        io.to(playerId).emit('buyAssets', availableAssetsToBuy);
      }
    } else if (empiresByAdjacentTiles.size > 1) {
      console.log("There was more than one adjacent empire");
      // Are all empires safe? If YES - dead tile. If NO - MERGER.
      // TODO
    } else {
      console.log("There were no adjacent empires. Getting empires with no tiles.");
      // What empires have no tiles? 
      const availableEmpires = getAvailableEmpires(game.empires);
      console.log("Available empires to select", availableEmpires);
      io.to(playerId).emit('selectEmpire', availableEmpires);
    }
  } else {
    console.log("No adjacent tiles");
    // No adjacent tiles. Any active empires with assets? Time to buy. Otherwise, advance to next player.
    const availableAssetsToBuy = getAvailableEmpiresWithAssets(game.empires);
    if (availableAssetsToBuy.length > 0) {
      io.to(playerId).emit('buyAssets', availableAssetsToBuy);
    } else {
      console.log("Nothing to buy, next player");
      advanceToNextPlayer(gameId);
      assignTileToPlayer(playerId, gameId);
    }
  }

  //games[gameId] = game;
  transmitGameStatus(gameId);
}

function addEmpireToBoard(gameId, empire, playerId) {
  let game = games[gameId];
  const player = game.players[playerId];
  // Set tiles in Empire.empire
  let empireTiles = getAdjacentTilesOnBoard(game.lastPlayedTile, game.board);
  empireTiles.push(game.lastPlayedTile);
  empireTiles.forEach((tile) => {
    game.empires[empire].tiles.add(tile);
    // Update tile in Board obj.
    game.board[tile] = empire;
  });

  // Log that player put empire on board.
  io.to(gameId).emit('log', `${player.name} created the empire ${empire}.`);

  // Give player one free asset of this empire, if available.
  if (game.empires[empire].assets > 0) {
    if (player.assets) {
      player.assets[empire] = 1;
    } else {
      player.assets = { [empire]: 1 }
    }
    io.to(gameId).emit('log', `${player.name} received 1 free asset of ${empire}.`);

    // Subtract 1 asset from empire.
    --game.empires[empire].assets;
  }

  transmitGameStatus(gameId);

  // Emit 'buyAssets' to player.
  const availableAssetsToBuy = getAvailableEmpiresWithAssets(game.empires);
  if (Object.keys(availableAssetsToBuy).length > 0 && player.cash > 0) { // TODO actually see if player can buy anything that's available.
    io.to(playerId).emit('buyAssets', availableAssetsToBuy);
  } else {
    console.log("Nothing to buy, next player");
    advanceToNextPlayer(gameId);
    assignTileToPlayer(playerId, gameId);
  }
}

function advanceToNextPlayer(gameId) {
  let game = games[gameId];
  const playerIds = Object.keys(game.players);
  const activePlayerIndex = playerIds.indexOf(game.activePlayer);
  if (activePlayerIndex === (playerIds.length - 1)) {
    game.activePlayer = playerIds[0];
  } else {
    game.activePlayer = playerIds[activePlayerIndex + 1];
  }
  transmitGameStatus(gameId);
}
