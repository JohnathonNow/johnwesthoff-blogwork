import * as Drawing from './drawing.js';
import * as Userlist from './userlist.js';
import * as Pages from './pages.js';

function onload_billiards() {

    var gName = null;
    var socket = null;
    var gAssign = null;
    var gState = null;
    var lastStroke = 0;
    var repull = true;
    var gameover = false;
    var gMyGuessers = null;
    var gMyGuesses = null;
    var canvas = null;
    var canvas;
    const gallery = new Drawing.Gallery(document.getElementById("gallery"), document.getElementById("controls"));
    const lobby = new Userlist.UserList(document.getElementById("user-list-2"));
    const pages = new Pages.Pages();
    pages.addPage("running", document.getElementById("progress-container"), "flex");
    pages.addPage("lobby", document.getElementById("lobby-container"));
    pages.addPage("endgame", document.getElementById("endgame-container"));
    pages.goTo("lobby");


    function reset() {
        gMyGuessers = new Map();
        gMyGuesses = new Map();
        gAssign = null;
        gState = null;
        lastStroke = 0;
        repull = false;
        gameover = false;
        lobby.clear();
        ingamenames.clear();
        endgamenames.clear();
        gallery.clear();
    }

    function tick(state) {
        gState = state;
        let timer = document.getElementById("timer");
        if (state["state"] == "RUNNING") {
            pages.goTo("running");
            lobby.setContainer(document.getElementById("user-list-1"));
            timer.style.display = "block";
            timer.value = state["time"];
            timer.max = state["timelimit"];
            canvas.setSize();
        } else if (state["state"] == "LOBBY") {
            gameover = false;
            pages.goTo("lobby");
            lobby.setContainer(document.getElementById("user-list-2"));
            timer.style.display = "none";
        } else if (state["state"] == "POSTGAME") {
            pages.goTo("endgame");
            lobby.setContainer(document.getElementById("user-list-3"));
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
    canvas.addEventListener("undo", e => {
        lastStroke = canvas.getStrokes().length;
        socket.send(JSON.stringify({ "Undo": { "i": e.detail.newlength } }));
    });
    document.getElementById("name").onkeydown = function (e) {
        if (e.key  == "Enter") {
            gName = e.target.value;
            document.getElementById("game").style.display = "block";
            document.getElementById("login").style.display = "none";
            connect();
            document.cookie = gName;
            canvas = gallery.add(gName, true);
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

document.body.onload = onload_billiards;