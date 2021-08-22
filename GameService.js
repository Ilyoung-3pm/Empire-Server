function generateTiles() {
  const yCoords = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
  let tiles = yCoords.map((y) => {
    let row = [];
    for (let x = 1; x < 13; x++) {
      row.push(x + '-' + y);
    }
    return row;
  })

  // Flatten 2D array and shuffle tiles randomly.
  tiles = shuffleTiles(tiles.flat());

  // Tiles are a stack. Pop them to give to players as needed. 
  return tiles;
}

function shuffleTiles(unshuffledTiles) {
  let tiles = [...unshuffledTiles]
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

exports.shuffleTiles = shuffleTiles;

function generateDefaultEmpires() {
  let defaultEmpires = {};
  const empireNames = ['WINGSPAN', 'TOTEM', 'GLOBAL', 'PALADIN', 'JUBILEE', 'ROYAL', 'CITADEL'];
  empireNames.forEach((empire) => defaultEmpires[empire] = {
    tiles: new Set(),
    assets: 25,
    safe: false
  });
  return defaultEmpires;
}


exports.initializeGame = function (game) {
  // For each Empire, assign properties: tiles, assets
  game.empires = generateDefaultEmpires();

  // Assign each player $6000.
  game.tiles = generateTiles();
  Object.keys(game.players).forEach((playerId) => {
    let player = game.players[playerId];
    player.tiles = new Set();
    player.cash = 6000;
  });

  game.board = {};

  return game;
}

exports.calculateDistanceTo1A = function (tile) {
  const row = Number(tile.split('-')[0]);
  const column = tile.charCodeAt(tile.length - 1);
  return (row + column) - 66;
}

/* Returns an array of the tiles that are adjacent to this tile. */
function getAdjacentTiles(tile) {
  let adjacentTiles = [];
  const row = Number(tile.split('-')[0]);
  const column = tile.charCodeAt(tile.length - 1);

  // Is there a tile above?
  if (column > 66) { // Not A...
    adjacentTiles.push(row + '-' + String.fromCharCode(column - 1));
  }

  // Is there a tile below?
  if (column < 73) { // Not I.
    adjacentTiles.push(row + '-' + String.fromCharCode(column + 1));
  }

  // Is there a tile to the left?
  if (row > 1) {
    adjacentTiles.push((row - 1) + "-" + String.fromCharCode(column));
  }

  // Is there a tile to the right?
  if (row < 12) {
    adjacentTiles.push((row + 1) + "-" + String.fromCharCode(column));
  }
  return adjacentTiles;
}

exports.getAdjacentTiles = getAdjacentTiles;

/* Returns an array of tiles that are adjacent to this tile on the board. */
exports.getAdjacentTilesOnBoard = function (tile, board) {
  let adjacentTilesOnBoard = [];
  if (Object.keys(board).length > 0) {
    const boardTiles = new Set(Object.keys(board));
    const adjacentTiles = getAdjacentTiles(tile);

    adjacentTiles.forEach((adjTile) => {
      if (boardTiles.has(adjTile)) {
        adjacentTilesOnBoard.push(adjTile);
      }
    });
  }

  return adjacentTilesOnBoard;
}
/**
 * Determines which empires, if any, the adjacent tiles belong to.
 * @param {*} adjacentTiles An array of adjacent tiles.
 * @param {*} empires An object, where the key is the name of the empire and the value is another object with tiles, assets, and  safe keys.
 */
exports.getEmpiresByAdjacentTiles = function (adjacentTiles, empires) {
  let adjacentEmpires = new Set();
  Object.keys(empires).forEach((empire) => {
    adjacentTiles.forEach((tile) => {
      if (empires[empire].tiles.has(tile)) {
        adjacentEmpires.add(empire);
      }
    })
  });
  return adjacentEmpires;
}

exports.getAvailableEmpires = function (empires) {
  let availableEmpires = [];
  Object.keys(empires).forEach((empire) => {
    if (empires[empire].tiles.size === 0) {
      availableEmpires.push(empire);
    }
  });
  return availableEmpires;
}

exports.getAvailableEmpiresWithAssets = function (empires) {
  let availableEmpires = {};
  Object.keys(empires).forEach((empireName) => {
    const empire = empires[empireName];
    if (empire.tiles.size > 0 && empire.assets != 0) {
      availableEmpires[empireName] = empire.assets; // TODO pass # available and cost per asset.
    }
  });
  return availableEmpires;
}

