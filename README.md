# Empire Server (Backend)

To start, navigate to this folder in Terminal and type `node app.js`. A web server will start up on port 5001.

But if you want to run this locally with hot reload, use `npm start`. This will use nodemon and refresh the server if there are any code changes.

## Main Tech Stack
- Node.js
- Express.js
- socket.io

### Roadmap

- [x] Start an Express JS server.
- [x] Hook up Socket.io server.
- [x] When client emits message to create new game, generate a new game ID and add the player to it.
- [x] When client emits a message to join an existing game, add the player to the game's players list.
- [ ] Verify that game ID is valid when joining an existing game.
- [ ] Verify game has not started yet if player is attempting to join an existing game.
- [ ] Verify game is not full (more than 4 players) if player is attempting to join an existing game.
- [x] Generate and shuffle tiles.
- [x] Initialize game with tiles and give each player $6000.
- [x] Play the first tile for each player.
- [x] Determine which player goes first by whose tile is closest to 1-A.
- [ ] Determine which player is the next active player.
- [ ] Update game board state when player plays a tile.
- [ ] Determine when a tile creates an empire.
- [ ] Determine when a tile creates a merger between 2 empires.
- [ ] Send data regarding asset price per empire.
- [ ] Update game state when a player buys an asset.
- [ ] Update game state when a player trades assets for another empire's assets on merger.
- [ ] Determine if the game has met end-game conditions.