var gDrawer = null
var gName = null;
var gImageV = 0;
var gGuessV = 0;
var socket = null;
var gMap = new Map();

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
                document.getElementById("word").textContent = "Your word is " + data["Assign"]["assignment"];
            } else if (data["FullState"]) {
                for (var p in data["FullState"]["state"]["players"]) {
                    if (p !== gName) {
                        let player = data["FullState"]["state"]["players"][p];
                        console.log(player);
                        add_drawing(p, player["drawing"]).setAttribute("active", player["active"]);
                    }
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

    function tick(t) {
        $("#timer").animate({ val: t }, {
            duration: 200,
            easing: 'linear',
            step: function (val) {
                $("#timer").val(val);
            }
        });
    }

    function sendGuess(g) {
        socket.send(JSON.stringify({ "Guess": { "username": gName, "guess": g } }));
    }

    function sendDrawing() {
        var dataURL = canvas.toDataURL();
        socket.send(JSON.stringify({ "Image": { "username": gName, "image": dataURL } }));
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
            connect();
            on_visible();
        }
    });
    $("#guess").on("keydown", function search(e) {
        if (e.keyCode == 13) {
            sendGuess($('#guess').val());
            $('#guess').val('');
        }
    });
    setInterval(function () { tick($("#timer").val() - 1); }, 1000);
}
