var roomcode = null;
var readloop = null;
var games = null;
var handles = [];

function shutdown() {
    clearTimeout(readloop);
    for (var i = 0; i < handles.length; i++) {
        clearInterval(handles[i]);
    }
    handles.length = 0;
}

function addLoop(fun, interval) {
    handles.push(setInterval(fun, interval)); 
}

function read() {
    server_get(roomcode, function(data) {
        onRead(data);
        readloop = setTimeout(read, 50);
    });
}

function post(state) {
    server_post(roomcode, state, function(response) {
        onPost(response);
    });
}

$(function() {
    server_games(function (d) {
        games = d;
        console.log(games);
        server_register(0, function(data) {
            if (data['status'] === 'success') {
                console.log(data);
                roomcode = data['code'];
                $('#main').append($("<b/>", {html: roomcode}));
                $('#main').append(games[0]["serverhtml"]);
                $("body").append($("<script/>", { html: games[0]["serverjs"]}));
                read();
                onLoad(data);
            } else {

            }
        });
    });
});
