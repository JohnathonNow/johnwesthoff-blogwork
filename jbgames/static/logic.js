var username = null;
var roomcode = null;
var readloop = null;

function read() {
    client_get(roomcode, function(data) {
        console.log(data);
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
        } else {
            console.log(data);
        }
    });
}

function logout() {
    $('#menu').show();
    $('#game').empty();
    $('#game').hide();
    clearInterval(readloop);
}

function write() {
    var stuff = {"username": username, "data": "haha yes"};
    client_post(roomcode, stuff, function(data) {
        if (data['status'] === 'success') {
            console.log(data);
        } else {
            console.log(data);
        }
    });
}

$(function() {
    $('#connect').on('click', function(e) { login(); });
});
