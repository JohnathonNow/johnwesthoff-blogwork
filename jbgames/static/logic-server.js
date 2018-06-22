var roomcode = null;
var readloop = null;

function read() {
    server_get(roomcode, function(data) {
        console.log(data);
        server_post(roomcode, data, function(response) {
            console.log(response);
        });
        readloop = setTimeout(read, 50);
    });
}

$(function() {
    $('#connect').on('click', function(e) {
        server_register('function onLoad(d) { console.log("loaded"); } function onRead(d) { console.log(d); }', function(data) {
            if (data['status'] === 'success') {
                console.log(data);
                roomcode = data['code'];
                $('body').append(roomcode);
                read();
            } else {

            }
        });
    });
});
