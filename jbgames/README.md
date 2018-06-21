Server API
===

Server Side
--

Register room
..

- /new\_room
- One argument - 'game' - javascript for the clients to run
- Creates a new room on the server, running 'game'
- Returns 'status', containing the request status, and 'code', containing the new room code

Post status
..

- /server\_post
- Two arguments - 'code' - the room code, and 'status' - a json object containing the new game state for the clients
- Updates the game status, which the clients receive when they make requests
- Returns 'status', containing the request status

Get info
..

- /server\_info
- One argument - 'code' - the room code
- Fetches the messages sent from the clients to the server, as well as the client list
- Returns 'status', containing the request status, 'messages', containing a list of messages from the clients, and 'clients', containing a list of usernames of clients

Client Side
--

Register client
..

- /user\_register
- Two arguments - 'code' - the room code, and 'name' - the username
- Adds the user to the room's user list
- Returns 'status', containing the request status, 'id', a numeric id unique to that user, and 'game', containing the javascript for the client

Post message
..

- /user\_post
- Two arguments - 'code' - the room code, and 'data' - the message data
- Adds a message to the list sent to the server
- Returns 'status', containing the request status

Get status
..

- /user\_info
- Two arguments - 'code' - the room code, and 'v' - the current data version the client has
- Fetches the current game state, busy waiting based off the value of 'v'
- Returns 'status', containing the request status, 'state', containin g the state set by the server, and 'v', containing the newest version number
