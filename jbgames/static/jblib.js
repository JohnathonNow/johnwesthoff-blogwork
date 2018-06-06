var v = 0;
function client_register(room_code, username, callback) {
    v = 0;
    $.get("user_register", {'code': room_code, 'name': username}, function(response) {
        var data = JSON.parse(response);
        if (callback) {
            callback(data);
        }
    }).fail(function() {
        client_register(room_code, username, callback);
    });
}

function client_post(room_code, message, callback) {
    $.get("user_post", {'code': room_code, 'data': JSON.stringify(message)}, function(response) {
        var data = JSON.parse(response);
        if (callback) {
            callback(data);
        }
    }).fail(function() {
        client_post(room_code, message, callback);
    });
}

function client_get(room_code, callback) {
    $.get("user_info", {'code': room_code, 'v': v}, function(response) {
        var data = JSON.parse(response);
        console.log(data);
        if ('v' in data) {
            v = data['v'];
        }
        if ('state' in data) {
            data['state'] = JSON.parse(data['state']);
        }
        if (callback) {
            callback(data);
        }
    }).fail(function() {
        client_get(room_code, callback);
    });
}

