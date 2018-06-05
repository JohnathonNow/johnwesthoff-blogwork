var roomcode = null;
var readloop = null;

function read() {
    server_get(roomcode, function(data) {
        console.log(data);
        readloop = setTimeout(read, 50);
    });
}

$(function() {
    $('#connect').on('click', function(e) {
        server_register(function(data) {
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
