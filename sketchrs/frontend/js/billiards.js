var gDrawer = null
var gName = null;
var gImageV = 0;
var gGuessV = 0;
var socket = null;
var gMap = new Map();
var gMapLobby = new Map();
var gAssign = null;
var gState = null;


function onload_billiards() {
    
    function connect() {
        console.log("PLANETARY (GO!)")
        socket = new WebSocket('ws://' + window.location.hostname + ':3030/chat?name=' + encodeURIComponent(gName));
        //socket = new WebSocket('ws://' + window.location.hostname + ':3030/chat');
        console.log(socket)
        // Event listener for when the WebSocket connection is established
        socket.addEventListener('open', event => {
            console.log('Connected to chat server');
        });

        // Event listener for incoming messages from the server
        socket.addEventListener('message', event => {
            const message = event.data;
            console.log('Received message:', message);
            let data = JSON.parse(message);
            if (data["Guess"]) {
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
                add_drawing(data["Image"]["username"], data["Image"]["image"])
            } else if (data["Assign"]) { 
                gAssign = data["Assign"]["assignment"];
                document.getElementById("word").textContent = "Your word is " + gAssign;
            } else if (data["FullState"]) {
                let namelist = get_namelist(data["FullState"]["state"]);
                for (var p in data["FullState"]["state"]["players"]) {
                    console.log("DOING " + p);
                    let player = data["FullState"]["state"]["players"][p];
                    if (p !== gName) {
                        console.log(player);
                        add_drawing(p, player["drawing"]).setAttribute("active", player["active"]);
                    }
                    let nametag = add_player(p);
                    nametag.setAttribute("active", player["active"]);
                    namelist.append(nametag);
                    if (p == gName) {
                        nametag.setAttribute("me", true);
                    }
                    if (data["FullState"]["state"]["state"] == "RUNNING" && !gAssign) {
                        sendAssign();
                    }
                    tick(data["FullState"]["state"]);
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
        if (state["state"] == "RUNNING") {
            document.getElementById("progress-container").style.display = "flex";
            document.getElementById("lobby-container").style.display = "none";
            document.getElementById("endgame-container").style.display = "none";
            on_visible();
        } else if (state["state"] == "LOBBY") {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("lobby-container").style.display = "block";
            document.getElementById("endgame-container").style.display = "none";
        } else if (state["state"] == "POSTGAME") {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("lobby-container").style.display = "none";
            document.getElementById("endgame-container").style.display = "block";
        }
    }

    function get_namelist(state) {
        if (state["state"] == "RUNNING") {
            return document.getElementById("user-list-1");
        } else if (state["state"] == "LOBBY") {
            return document.getElementById("user-list-2");
        } else if (state["state"] == "POSTGAME") {
            return document.getElementById("user-list-3");
        }
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
        
            gMap.get(e.target.getAttribute("__player")).style.display = "block";
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

    function add_drawing(drawer, image) {
        if (drawer == gName) {
            return;
        }
        if (!gMap.has(drawer)) {
            let newCanvas = document.createElement("img");
            gMap.set(drawer, newCanvas);
            newCanvas.classList = "image";
            document.getElementById("gallery").appendChild(newCanvas);
        }
        let canvas = gMap.get(drawer);
        canvas.setAttribute("src", image);
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
        var dataURL = canvas.toDataURL();
        socket.send(JSON.stringify({ "Image": { "image": dataURL } }));
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
    };
}
