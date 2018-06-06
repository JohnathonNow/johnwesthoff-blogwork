var username = null;
var roomcode = null;
var readloop = null;

function read() {
    client_get(roomcode, function(data) {
        console.log(data);
        readloop = setTimeout(read, 50);
    });
}

$(function() {
    $('#connect').on('click', function(e) {
        roomcode = $('#roomcode').val();
        username = $('#username').val();
        client_register(roomcode, username, function(data) {
            if (data['status'] === 'success') {
                read();
                console.log(data);
                $('body').append(data['id']);
            } else {
                console.log(data);
            }
        });
    });
    $('#send').on('click', function(e) {
        var stuff = {"username": username, "data": "haha yes"};
        client_post(roomcode, stuff, function(data) {
            if (data['status'] === 'success') {
                console.log(data);
            } else {
                console.log(data);
            }
        });
    });
});
