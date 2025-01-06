// Emit different events based off network
function connect() {
    reset();
    socket = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port + '/chat?name=' + encodeURIComponent(gName));
    //socket = new WebSocket('ws://' + window.location.hostname + ':3030/chat');
    console.log(socket)
    // Event listener for when the WebSocket connection is established
    socket.addEventListener('open', event => {
        repull = true;
        socket.send(JSON.stringify({ "Pull": { "username": gName, i: 0 } }));
    });

    // Event listener for incoming messages from the server
    socket.addEventListener('message', event => {
        const message = event.data;
        console.log(message);
        let data = JSON.parse(message);
        if (data["Reset"]) {
            reset();
        } else if (data["NewName"]) {
            alert("Name " + gName + " is taken! Try again!");
            location.reload();
        } else if (data["Guessed"]) {
            let chat = document.getElementById('answers');
            let line = document.createElement("div");
            let msg = document.createElement("b");
            msg.classList = "warn";
            msg.textContent = data["Guessed"]["guesser"] + " guessed " + data["Guessed"]["drawer"] + "'s word for " + data["Guessed"]["points"] + " points!";
            line.append(msg, document.createElement("br"));
            chat.append(line);
            if (data["Guessed"]["guesser"] == gName) {
                add_guessed(data["Guessed"]["drawer"]);
            }
            if (data["Guessed"]["drawer"] == gName) {
                add_guesser(data["Guessed"]["guesser"]);
            }
            while (chat.children.length > MAX_CHAT) {
                chat.removeChild(chat.children[0]);
            }
            chat.scrollTop = chat.scrollHeight;
        } else if (data["Guess"]) {
            let chat = document.getElementById('answers');
            let line = document.createElement("div");
            if (data["Guess"]["username"] === "") {
                let msg = document.createElement("b");
                msg.classList = "warn";
                msg.textContent = data["Guess"]["guess"];
                line.append(msg, document.createElement("br"));
            } else {
                let user = document.createElement("b");
                user.textContent = data["Guess"]["username"] + ": ";
                line.append(user, data["Guess"]["guess"], document.createElement("br"));
            }
            chat.append(line);
            while (chat.children.length > MAX_CHAT) {
                chat.removeChild(chat.children[0]);
            }
            chat.scrollTop = chat.scrollHeight;
        } else if (data["Image"]) {
            add_drawing(data["Image"]["username"], data["Image"]["image"])
            if (data["Image"]["username"] != gName && data["Image"]["i"] < gStrokes.get(data["Image"]["username"]).length) {
                socket.send(JSON.stringify({ "Pull": { "username": data["Image"]["username"], i: gStrokes.get(data["Image"]["username"]).length } }));
            }
            if (data["Image"]["username"] == gName && repull) {
                load_drawing(data["Image"]["image"]);
                repull = false;
                redraw();
            }
        } else if (data["Undo"]) {
            undo_other(data["Undo"]["username"]);
        } else if (data["Assign"]) {
            gAssign = data["Assign"]["assignment"];
            document.getElementById("word").textContent = "Your word is " + gAssign;
        } else if (data["FullState"]) {
            if (gameover && data["FullState"]["state"]["state"] == "LOBBY") {
                console.log("NUKED!");
                reset();
            }
            let namelist = get_namelist(data["FullState"]["state"]);
            for (var p in data["FullState"]["state"]["players"]) {
                let player = data["FullState"]["state"]["players"][p];
                let nametag = add_player(p);
                nametag.setAttribute("active", player["active"]);
                if (!gameover) {
                    namelist.append(nametag);
                }
                if (p == gName) {
                    nametag.setAttribute("me", true);
                }
                for (var guesser in player["guess_list"]) {
                    if (p == gName) {
                        add_guesser(guesser);
                    } else if (guesser == gName) {
                        add_guessed(p);
                    }
                }
                add_drawing(p, []);
            }
            tick(data["FullState"]["state"]);
            if (data["FullState"]["state"]["state"] == "RUNNING" && !gAssign) {
                sendAssign();
            }
            for ([player, istrokes] of gStrokes) {
                socket.send(JSON.stringify({ "Pull": { "username": player, i: istrokes.length } }));
            }
        }
    });

    // Event listener for WebSocket errors
    socket.addEventListener('error', event => {
        console.error('WebSocket error:', event);
    });

    // Event listener for WebSocket connection closure
    socket.addEventListener('close', event => {
        setTimeout(connect, 4000);
    });
}