const MAX_CHAT = 30;

var gName = null;
var socket = null;
var gMap = new Map();
var gStrokes = null;
var gMapLobby = null;
var gAssign = null;
var gState = null;
var lastStroke = 0;
var gUndo = null; // function
var gstrks = null;
var repull = true;
var gameover = false;
var gImgMap = new Map();
var gMyGuessers = null;
var gMyGuesses = null;
var lastJudged = null;
var gWord = null;

function reset() {
    gStrokes = new Map();
    lastStroke = 0;
    gstrks = null;
    clear_canvas();
}

function onload_billiards() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const todayFormatted = `${year} ${month} ${day}`;

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
            gameend();
        }
        if (gName == state["host"]) {
            document.getElementById("start").style.display = "block";
            document.getElementById("restart").style.display = "block";
        }
    }

    gUndo = function (qty) {
        //lastStroke -= 2;
        lastStroke = strokes.length;
        socket.send(JSON.stringify({ "Undo": { "i": qty } }));
    }

    function sendDrawing() {
        var data =  canvas.toDataURL();
            //strokes.slice(lastStroke).map(x => JSON.stringify(x));
        lastStroke = strokes.length;
        if (data.length > 0) {
            var body = (JSON.stringify({ "image": data }));
            fetch("/judge", {body: body, method: "POST", headers: {
                "Content-Type": "application/json",
              }}).then((response) => {
                return response.json();
            }).then((info) => {
                document.getElementById("score").textContent = info["Score"]["score"];
                const offscreen = new OffscreenCanvas(512 + 8 + 8, 512 + 24 + 8 + 8);
                const octx = offscreen.getContext("2d");
                octx.fillStyle = 'white'; 
                octx.fillRect(0, 0, octx.canvas.width, octx.canvas.height); 
                octx.drawImage(canvas, 8, 24 + 8, 512, 512);
                octx.fillStyle = 'black'; 
                octx.textAlign = 'center'; 
                octx.font = "12px serif";
                octx.fillText("I drew " + gWord + " and scored " + info["Score"]["score"].toFixed(2), octx.canvas.width / 2, 16);
                const blob = offscreen.convertToBlob().then((blob) => {
                const clip = [new ClipboardItem({ [blob.type]: blob })];
                navigator.clipboard.write(clip).then((e) => console.log(e));
                }
                )
            });
        }
    }
    
    function draw_event_handler(e) {
        e.preventDefault();
        //localStorage.setItem("drawing-" + todayFormatted, canvas.toDataURL());
        localStorage.setItem("drawing-" + todayFormatted, JSON.stringify(strokes));
        //sendDrawing();
    }
    let canvas = document.getElementById("canvas");
    canvas.addEventListener("touchend", draw_event_handler);
    canvas.addEventListener("mouseleave", draw_event_handler);
    canvas.addEventListener("mouseup", draw_event_handler);
    //document.getElementById("progress-container").style.display = "none";
    //document.getElementById("lobby-container").style.display = "none";
    //document.getElementById("endgame-container").style.display = "none";
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
        let judge = document.getElementById("judge");
        if (!lastJudged || lastJudged + 10000 < Date.now()) {
            judge.disabled = false;
        }
    }, 1000);
    document.getElementById("judge").onclick = function(e) {
        let now = Date.now();
        if (lastJudged && lastJudged > now - 10000) {
            return
        }
        lastJudged = now;
        sendDrawing();
        e.target.disabled = true;
    };
    fetch("/word").then((response) => {
        console.log(response);
        return response.text();
    }).then((data) => {
        console.log(data);
        document.getElementById("word").textContent = gWord = data;
    });
    const olddraw = localStorage.getItem("drawing-" + todayFormatted);
    if (olddraw) {
        let d = JSON.parse(olddraw);
        strokes = strokes.concat(d);
        for (var i = 0; i < strokes.length; ++i) {
            if (strokes[i].x == null) {
                strokes[i].x = NaN;
            }
            if (strokes[i].y == null) {
                strokes[i].y = NaN;
            }
        }
        redraw();
    }
}
