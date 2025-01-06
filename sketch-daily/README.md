End goal: A drawing game like [../sketch](../sketch), but re-written in rust.

Tables:
Games:
    id          INTEGER PRIMARY KEY
    turn        INTEGER
    version     INTEGER
    drawer      INTEGER
    time        INTEGER
    word        TEXT
    image       TEXT

Players:
    name        TEXT PRIMARY KEY
    game_id     INTEGER
    correct     INTEGER
    drawer      INTEGER
    score       INTEGER

Guesses:
    id          INTEGER PRIMARY KEY
    game_id     INTEGER
    guesser     TEXT
    guess       TEXT


Todo:
[ ] fix the above lies  
[ ] improve performance of redraw by keeping track of the last drawing action  
[ ] add custom cursors  
[ ] improve mouse exiting / entering drawing area  

