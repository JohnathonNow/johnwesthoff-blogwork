# Sketch Billiards - A multiplayer guess-the-drawing game

## Backend
The backend is written in Python using CherryPy. The backend stores a queue of messages for clients, and sends them
all when the client requests them. 

## Frontend
The frontend is written for the browser in JavaScript, using jQuery.
The frontend communicates with the backend using long polling. Guesses and pictures are PUT to the server.

## To Do:
 - [ ] Reorganize frontend code to be more manageable - specifically, separate drawing code from game logic.  
 - [ ] Reorganize backend code to be more manageable - specifically, separate game logic from networking.  
 - [ ] Consider [WordNet](http://www.nltk.org/howto/wordnet.html) for deciding if a guess is close.
