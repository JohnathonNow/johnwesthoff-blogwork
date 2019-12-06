Endpoints:  
- / should give you a unique token  
- posting to /game should create a new game  
- /game/$X should let you join game $X  
- /game/$X/messages should let you get messages based off your token  

If 30 seconds go by without a client requesting messages, log them off.
