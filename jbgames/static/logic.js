var name;
var code;
$(function() {
    $('#connect').on('click', function(e) {
        code = $('#roomcode').val();
        name = $('#username').val();
        client_register(code, name, function(data) {
            if (data['status'] === 'success') {
                console.log(data);
                $('body').append(data['id']);
            } else {
                console.log(data);
            }
        });
    });
    $('#send').on('click', function(e) {
        var stuff = {"username": name, "data": "haha yes"};
        client_post(code, stuff, function(data) {
            if (data['status'] === 'success') {
                console.log(data);
            } else {
                console.log(data);
            }
        });
    });
});
