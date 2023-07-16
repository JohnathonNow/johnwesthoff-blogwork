const MAX_CHAT = 30;

var gName = null;
var socket = null;
var gMap = new Map();
var gMapLobby = null;
var gAssign = null;
var gState = null;
var lastStroke = 0;
var gstrks = null;
var repull = true;
var gameover = false;
var gImgMap = new Map();
var gMyGuessers = null;
var gMyGuesses = null;
var canvas = null;

function reset() {
    gMapLobby = new Map();
    gMyGuessers = new Map();
    gMyGuesses = new Map();
    gAssign = null;
    gState = null;
    lastStroke = 0;
    gstrks = null;
    repull = false;
    gameover = false;
    document.getElementById("user-list-3").innerHTML = "";
    document.getElementById("user-list-2").innerHTML = "";
    document.getElementById("user-list-1").innerHTML = "";
    gMap.set(gName, canvas);
    canvas.clearCanvas();
}


function onload_billiards() {
    canvas = new Canvas(document.getElementById("canvas"), document.getElementById("controls"), true);
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
                let can = add_drawing(data["Image"]["username"], data["Image"]["image"]);
                if (data["Image"]["username"] != gName && data["Image"]["i"] < can.getStrokes().length) {
                    socket.send(JSON.stringify({ "Pull": { "username": data["Image"]["username"], i: can.getStrokes().length } }));
                }
                if (data["Image"]["username"] == gName && repull) {
                    canvas.load(data["Image"]["image"]);
                    repull = false;
                    canvas.redraw();
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
                for ([player, can] of gMap) {
                    socket.send(JSON.stringify({ "Pull": { "username": player, i: can.getStrokes().length } }));
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

    function tick(state) {
        gState = state;
        let timer = document.getElementById("timer");
        if (state["state"] == "RUNNING") {
            document.getElementById("progress-container").style.display = "flex";
            document.getElementById("lobby-container").style.display = "none";
            document.getElementById("endgame-container").style.display = "none";
            timer.style.display = "block";
            timer.value = state["time"];
            timer.max = state["timelimit"];
            canvas.setSize();
        } else if (state["state"] == "LOBBY") {
            gameover = false;
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("lobby-container").style.display = "block";
            document.getElementById("endgame-container").style.display = "none";
            timer.style.display = "none";
        } else if (state["state"] == "POSTGAME") {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("lobby-container").style.display = "none";
            document.getElementById("endgame-container").style.display = "block";
            timer.style.display = "none";
            show_winners();
        }
        if (gName == state["host"]) {
            document.getElementById("start").style.display = "block";
            document.getElementById("restart").style.display = "block";
        }
    }

    function show_winners() {
        if (gameover) {
            return;
        }
        gameover = true;
        let namelist = document.getElementById("user-list-3");
        let values = Object.entries(gState["players"]);
        let highscore = Math.max(...values.map(x => x[1].score));
        for (let i = 0; i < values.length; ++i) {
            setTimeout(function () {
                let player = values[i][0];
                let child = add_player(player);
                child.style.width = "10%";
                namelist.appendChild(child);
                try {
                    let image = document.createElement("div");
                    image.classList = "finalimagecontainer";
                    let picture = document.createElement("img");
                    let can = gMap.get(player);
                    if (can) {
                        can.redraw();
                        picture.src = can.getCanvas().toDataURL();
                    }
                    image.onclick = function() {
                        picture.src = gMap.get(player).getCanvas().toDataURL();
                        Array.prototype.forEach.call(document.getElementsByClassName("finalimagecontainer"), d=>d.style.display = "none");
                    };
                    image.appendChild(picture);
                    document.getElementById("finalgallery").appendChild(image);
                    gImgMap.set(player, image);
                } catch (e) {console.log(e)}
                child.textContent = player + " [0]";
                if (gState["players"][player]["score"] == highscore) {
                    child.setAttribute("winner", "true");
                }
                child.setAttribute("moving", "true");
                setTimeout(function () {
                    child.style.width = (10 + (gState["players"][player]["score"] * 80 / highscore)) + "%";
                    var tally = 0;
                    var myInterval = setInterval(function () {
                        tally += Math.ceil(gState["players"][player]["score"] / 80);
                        if (tally >= gState["players"][player]["score"]) {
                            tally = gState["players"][player]["score"];
                            clearInterval(myInterval);
                        }
                        child.textContent = player + " [" + tally + "]";
                    }, 16);
                    setTimeout(function () {
                        child.setAttribute("moving", "false");
                    }, 500);
                }, 1000);
            }, i * 3000);
        }
    }

    function get_namelist(state) {
        if (state["state"] == "RUNNING") {
            return document.getElementById("user-list-1");
        } else {
            return document.getElementById("user-list-2");
        }
    }

    gUndo = function (qty) {
        //lastStroke -= 2;
        lastStroke = strokes.length;
        socket.send(JSON.stringify({ "Undo": { "i": qty } }));
    }

    function add_player(player) {
        if (!gMapLobby.has(player)) {
            const listItem = document.createElement('li');
            listItem.textContent = player;
            listItem.classList.add('user-list-item');
            listItem.setAttribute("__player", player);
            listItem.onclick = player_click;
            gMapLobby.set(player, listItem);
        }
        let nametag = gMapLobby.get(player);
        return nametag;
    }

    function player_click(e) {
        if (gState["state"] == "RUNNING") {
            for (let p of gMap.values()) {
                console.log(p);
                p.hide();
            }
            for (let p of gMapLobby.values()) {
                p.setAttribute("selected", "false");
            }
            let can = gMap.get(e.target.getAttribute("__player"));
            can.show();
            can.setSize();
            can.redraw();
            canvas.redraw();
            gMapLobby.get(e.target.getAttribute("__player")).setAttribute("selected", "true");
        } else if (gState["state"] == "POSTGAME") {
            gImgMap.get(e.target.getAttribute("__player")).style.display = "block";
            gImgMap.get(e.target.getAttribute("__player")).querySelector("img").style.display = "block";
        }
    }

    function cycle(_backwards) {
        if (gState["state"] == "RUNNING") {
            let e = document.querySelector(".user-list-item[selected=\"true\"] + li") || document.querySelector("li.user-list-item:nth-child(1)");
            console.log(e);
            for (let p of gMap.values()) {
                p.hide();
            }
            for (let p of gMapLobby.values()) {
                p.setAttribute("selected", "false");
            }
            let can = gMap.get(e.getAttribute("__player"));
            can.show();
            can.setSize();
            can.redraw();
            canvas.redraw();
            gMapLobby.get(e.getAttribute("__player")).setAttribute("selected", "true");
        }
    }

    function current_view(e) {
        for (e of document.getElementsByClassName("image")) {
            if (e.style.display != "none") {
                return e;
            }
        }
    }

    function undo_other(drawer) {
        if (drawer == gName) {
            return;
        }
        if (!gMap.has(drawer)) {
            let newCanvasElement = document.createElement("canvas");
            gMap.set(drawer, new Canvas(newCanvasElement, document.getElementById("controls"), false));
            newCanvasElement.classList = "image";
            document.getElementById("gallery").appendChild(newCanvasElement);
        }
        let theircanvas = gMap.get(drawer);
        theircanvas.undo();
        add_drawing(drawer, []);
    }

    function add_drawing(drawer, image) {
        if (drawer == gName) {
            return;
        }
        if (!gMap.has(drawer)) {
            let newCanvasElement = document.createElement("canvas");
            gMap.set(drawer, new Canvas(newCanvasElement, document.getElementById("controls"), false));
            newCanvasElement.classList = "image";
            document.getElementById("gallery").appendChild(newCanvasElement);
        }
        let theircanvas = gMap.get(drawer);
        theircanvas.add(image);
        theircanvas.setSize();
        theircanvas.redraw();
        canvas.redraw();
        return theircanvas;
    }

    function start() {
        socket.send(JSON.stringify({ "Start": {} }));
    }

    function restart() {
        socket.send(JSON.stringify({ "Restart": {} }));
    }

    function sendAssign() {
        socket.send(JSON.stringify({ "Assign": {} }));
    }

    function sendGuess(g) {
        socket.send(JSON.stringify({ "Guess": { "guess": g } }));
    }

    function sendDrawing() {
        let strokes = canvas.getStrokes();
        var data = strokes.slice(lastStroke).map(x => JSON.stringify(x));
        lastStroke = strokes.length;
        if (data.length > 0) {
            socket.send(JSON.stringify({ "Image": { "image": data } }));
        }
    }
    
    function add_guesser(guesser) {
        let a = add_player(guesser);
        if (!gMyGuessers.has(guesser)) {
            gMyGuessers.set(guesser, a);
            a.setAttribute("movingguesser", "true");
            a.setAttribute("guesser", "true");
            setTimeout(function() {a.setAttribute("movingguesser", "false");}, 1);
        }
    }

    function add_guessed(drawer) {
        let a = add_player(drawer);
        if (!gMyGuesses.has(drawer)) {
            gMyGuesses.set(drawer, a);
            a.setAttribute("movingguessed", "true");
            a.setAttribute("guessed", "true");
            setTimeout(function() {a.setAttribute("movingguessed", "false");}, 1);
        }
    }
    function draw_event_handler(e) {
        e.preventDefault();
        sendDrawing();
    }
    canvas.addEventListener("stroke", draw_event_handler);
    document.getElementById("name").onkeydown = function (e) {
        if (e.key  == "Enter") {
            gName = e.target.value;
            document.getElementById("game").style.display = "block";
            document.getElementById("login").style.display = "none";
            connect();
            document.cookie = gName;
        }
    };
    document.getElementById("guess").addEventListener("keydown", function search(e) {
        if (e.key  == "Enter") {
            gName = e.target.value;
            sendGuess(e.target.value);
            e.target.value = "";
        } else if (e.key  == "Tab") {
            cycle(e.shiftKey);
            e.preventDefault();
        }
    });

    document.onmouseup = function () { document.getElementById("guess").focus(); };

    document.getElementById("start").onclick = function search(e) {
        start();
    };
    document.getElementById("restart").onclick = function search(e) {
        restart();
    };
    document.getElementById("progress-container").style.display = "none";
    document.getElementById("lobby-container").style.display = "none";
    document.getElementById("endgame-container").style.display = "none";
    if (document.cookie != "") {
        document.getElementById("name").value = document.cookie;
    }
    window.onresize = function () {
        try {
            see_element(current_view());
            redraw_other(current_view().getContext("2d"), gstrks);
            redraw();
        } catch { }
    };
    setInterval(function () {
        if (gState && gState["state"] == "RUNNING") {
            let timer = document.getElementById("timer");
            timer.value += 1;
        }
    }, 1000);
}
