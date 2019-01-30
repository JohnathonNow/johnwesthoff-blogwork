function server_games(callback) {
    $.get('games.json', function(response) {
        if (callback) {
            callback(response);
        }
    }).fail(function() {
        server_register(callback);
    });
}

function server_register(game, callback) {
    $.get('new_room', {'game': game}, function(response) {
        var data = JSON.parse(response);
        if (callback) {
            callback(data);
        }
    }).fail(function() {
        server_register(callback);
    });
}

function server_post(room_code, state, callback) {
    $.get('server_post', {'code': room_code, 'state': JSON.stringify(state)}, function(response) {
        var data = JSON.parse(response);
        if (callback) {
            callback(data);
        }
    }).fail(function() {
        server_post(room_code, state, callback);
    });
}

function server_get(room_code, callback) {
    $.get('server_info', {'code': room_code}, function(response) {
        var data = JSON.parse(response);

        if ('messages' in data) {
            data['messages'] = data['messages'].map(x => JSON.parse(x));
        }

        if (callback) {
            callback(data);
        }
    }).fail(function() {
        server_get(room_code, callback);
    });
}

