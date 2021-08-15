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
  tiles = tiles.flat();
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Tiles are a stack. Pop them to give to players as needed. 
  return tiles;
}

function generateDefaultEmpires() {
  let defaultEmpires = {};
  const empireNames = ['WINGSPAN', 'TOTEM', 'GLOBAL', 'PALADIN', 'JUBILEE', 'ROYAL', 'CITADEL'];
  empireNames.forEach((empire) => defaultEmpires[empire] = {
    tiles: [],
    assets: 25
  });
  return defaultEmpires;
}


exports.initializeGame = function (game) {
  // For each Empire, assign properties: tiles, assets
  game.empires = generateDefaultEmpires();

  // Assign each player 1 tile and $6000.
  game.tiles = generateTiles();
  Object.keys(game.players).forEach((playerId) => {
    let player = game.players[playerId];
    player.cash = 6000;
    const firstTile = game.tiles.pop();
    player.tiles = [firstTile];
    game.players[playerId] = player;
  });

  console.log("initialized game", game);
  return game;
}