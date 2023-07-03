var gDrawer = null
var gName = null;
var gImageV = 0;
var gGuessV = 0;
var socket = null;
var gMap = new Map();
var gStrokes = new Map();
var gMapLobby = new Map();
var gAssign = null;
var gState = null;
var lastStroke = 0;
var gUndo = null;
var gstrks = null;
var repull = true;
var gameover = false; 

function reset() {
    gMap = new Map();
    gStrokes = new Map();
    gMapLobby = new Map();
    gAssign = null;
    gState = null;
    lastStroke = 0;
    gstrks = null;
    repull = true;
    gameover = false; 
}

function onload_billiards() {
    
    function connect() {
        console.log("PLANETARY (GO!)")
        socket = new WebSocket('ws://' + window.location.hostname + ':'+ window.location.port +'/chat?name=' + encodeURIComponent(gName));
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
            console.log('Received message:', message);
            let data = JSON.parse(message);
            if (data["Reset"]) {
                reset();
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
                    user.textContent = data["Guess"]["username"]  + ": ";
                    line.append(user, data["Guess"]["guess"], document.createElement("br"));
                }
                chat.append(line);
                while (chat.children.length > 30) {
                    chat.removeChild(chat.children[0]);
                }
                chat.scrollTop = chat.scrollHeight;
            } else if (data["Image"]) {
                console.log("EEEEE: " + data["Image"]["i"]);
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
                let namelist = get_namelist(data["FullState"]["state"]);
                for (var p in data["FullState"]["state"]["players"]) {
                    console.log("DOING " + p);
                    let player = data["FullState"]["state"]["players"][p];
                    let nametag = add_player(p);
                    nametag.setAttribute("active", player["active"]);
                    namelist.append(nametag);
                    if (p == gName) {
                        nametag.setAttribute("me", true);
                    }
                    add_drawing(p, []);
                }
                tick(data["FullState"]["state"]);
                if (data["FullState"]["state"]["state"] == "RUNNING" && !gAssign) {
                    sendAssign();
                }
                for ([player, strokes] of gStrokes) {
                    socket.send(JSON.stringify({ "Pull": { "username": player, i: strokes.length } }));
                }
            }
        });

        // Event listener for WebSocket errors
        socket.addEventListener('error', event => {
            console.error('WebSocket error:', event);
        });

        // Event listener for WebSocket connection closure
        socket.addEventListener('close', event => {
            console.log('Disconnected from chat server');
            setTimeout(connect, 4000);
        });
    }

    function tick(state) {
        gState = state;
        console.log(state)
        let timer = document.getElementById("timer");
        if (state["state"] == "RUNNING") {
            document.getElementById("progress-container").style.display = "flex";
            document.getElementById("lobby-container").style.display = "none";
            document.getElementById("endgame-container").style.display = "none";
            timer.style.display = "block";
            timer.value = state["time"];
            timer.max = state["timelimit"];
            on_visible();
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
    }

    function show_winners() {
        if (gameover) {
            return;
        }
        gameover = true;
        console.log(Object.entries(gState["players"]));
        let namelist = document.getElementById("user-list-3");
        let values = Object.entries(gState["players"]);
        let highscore = Math.max(...values.map(x => x[1].score));
        console.log(highscore);
        for (let i = 0; i < values.length; ++i) {
            setTimeout(function() {
                let player = values[i][0];
                let child = add_player(player);
                child.style.width = "10%";
                namelist.appendChild(child);
                child.textContent = player + " [0]";
                setTimeout(function() {
                child.style.width = (10 + (gState["players"][player]["score"] * 80 / highscore)) + "%";
                var tally = 0;
                var myInterval = setInterval(function(){
                    tally += Math.ceil(gState["players"][player]["score"] / 80);
                    if (tally >= gState["players"][player]["score"]) {
                        tally = gState["players"][player]["score"];
                        clearInterval(myInterval);
                    }
                    child.textContent = player + " ["+tally+"]";
               }, 16);
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
    
    gUndo = function(qty) {
        //lastStroke -= 2;
        lastStroke = strokes.length;
        socket.send(JSON.stringify({ "Undo": { "i": qty} }));
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
                p.style.display = "none";
                console.log(p);
            }
            for (let p of gMapLobby.values()) {
                p.setAttribute("selected", "false");
            }
            let can = gMap.get(e.target.getAttribute("__player"));
            gstrks = gStrokes.get(e.target.getAttribute("__player"));
            can.style.display = "block";
            see_element(can);
            if (gstrks) {
                redraw_other(can.getContext("2d"), gstrks);
            }
            redraw();
            gMapLobby.get(e.target.getAttribute("__player")).setAttribute("selected", "true");
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
        if (!gStrokes.has(drawer)) {
            gStrokes.set(drawer, []);
            return;
        }
        let strks = gStrokes.get(drawer);
        gStrokes.set(drawer, strks.slice(0, strks[strks.length - 1]["t"]));
        add_drawing(drawer, []);
    }

    function add_drawing(drawer, image) {
        if (drawer == gName) {
            return;
        }
        if (!gStrokes.has(drawer)) {
            gStrokes.set(drawer, []);
        }
        if (!gMap.has(drawer)) {
            let newCanvas = document.createElement("canvas");
            gMap.set(drawer, newCanvas);
            newCanvas.classList = "image";
            document.getElementById("gallery").appendChild(newCanvas);
        }
        console.log("AAAAAAA: " + gStrokes.get(drawer).length);
        let strks = gStrokes.get(drawer).concat(image.map(x => JSON.parse(x)));
        gStrokes.set(drawer, strks);
        let canvas = gMap.get(drawer);
        see_element(canvas);
        redraw_other(canvas.getContext("2d"), strks);
        redraw();
        return canvas;
    }

    function start() {
        console.log("GO!");
        socket.send(JSON.stringify({ "Start": {  } }));
    }

    function sendAssign() {
        socket.send(JSON.stringify({ "Assign": { } }));
    }

    function sendGuess(g) {
        socket.send(JSON.stringify({ "Guess": { "guess": g } }));
    }

    function sendDrawing() {
        var data = strokes.slice(lastStroke).map(x => JSON.stringify(x));
        lastStroke = strokes.length;
        if (data.length > 0) {
            socket.send(JSON.stringify({ "Image": { "image": data } }));
        }
    }

    $('#canvas').on('touchend mouseleave mouseup', function (e) {
        e.preventDefault();
        sendDrawing();
    });

    $("#name").on("keydown", function search(e) {
        if (e.keyCode == 13) {
            gName = $('#name').val();
            $('#game').show();
            $('#login').hide();
            gMap.set(gName, document.getElementById("canvas"));
            connect();
            document.cookie = gName;
        }
    });
    $("#guess").on("keydown", function search(e) {
        if (e.keyCode == 13) {
            sendGuess($('#guess').val());
            $('#guess').val('');
        }
    });

    document.onmouseup = function(){document.getElementById("guess").focus();};
    
    document.getElementById("start").onclick = function search(e) {
        start();
    };
    document.getElementById("progress-container").style.display = "none";
    document.getElementById("lobby-container").style.display = "none";
    document.getElementById("endgame-container").style.display = "none";
    if (document.cookie != "") {
        document.getElementById("name").value = document.cookie;
    }
    window.onresize = function(){
        see_element(current_view());
        redraw_other(current_view().getContext("2d"), gstrks);
        redraw();
    };
    setInterval(function(){
        if (gState && gState["state"] == "RUNNING") {
            let timer = document.getElementById("timer");
            timer.value += 1;
        }
    }, 1000);
}
