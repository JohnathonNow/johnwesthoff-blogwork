var handles = [];
var readloop = null;

function logout() {
    $('#menu').show();
    $('#game').empty();
    $('#game').hide();
    clearTimeout(readloop);
    for (var i = 0; i < handles.length; i++) {
        clearInterval(handles[i]);
    }
    handles.length = 0;
}

function addLoop(fun, interval) {
    handles.push(setInterval(fun, interval)); 
}

$(function() {
    var username = null;
    var roomcode = null;

    function read() {
        client_get(roomcode, function(data) {
            onRead(data);
            readloop = setTimeout(read, 50);
        });
    }

    function login() { 
        roomcode = $('#roomcode').val();
        username = $('#username').val();
        client_register(roomcode, username, function(data) {
            if (data['status'] === 'success') {
                read();
                $('#menu').hide();
                $('#game').empty();
                $('#game').show();
                $("body").append($("<script/>", { html: data['game'] }));
                onLoad(data);
            } else {
                console.log(data);
            }
        });
    }


    function write(data) {
        var stuff = {"username": username, "data": data};
        client_post(roomcode, stuff, onWrite);
    }

    $('#connect').on('click', function(e) { login(); });
});
