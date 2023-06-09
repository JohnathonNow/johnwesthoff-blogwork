var gDrawer = null
var gName = null;

var socket = null;

function connect() {
socket = new WebSocket('ws://'+window.location.hostname+':3030/chat');

// Event listener for when the WebSocket connection is established
socket.addEventListener('open', event => {
  console.log('Connected to chat server');
});

// Event listener for incoming messages from the server
socket.addEventListener('message', event => {
  const message = event.data;
  console.log('Received message:', message);
  let data = JSON.parse(message);
  if (data["Guess"]) {
    msg = '';
    if (data["Guess"]["username"] === "") {
        msg += '<b class="warn">' + data["Guess"]["guess"] + '</b><br>'
    } else {
        msg += '<b>' + data["Guess"]["username"] + ':</b> ' + data["Guess"]["guess"] + '<br>'
    }
    $('#answers').html($('#answers').html() + msg);
  } else if (data["Image"]) {
    if (data["Image"]["username"] !== gName) {
        $("#picture").attr("src", data["Image"]["image"]);
        $('#picture').show();
        $('#canvas').hide();
    } else {
        $('#picture').hide();
        $('#canvas').show();
    }
  } else if (data["Assign"]) {
    $('#picture').hide();
    $('#canvas').show();
    console.log("oh");
    gDrawer = gName;
  }
});

// Event listener for WebSocket errors
socket.addEventListener('error', event => {
  console.error('WebSocket error:', event);
});

// Event listener for WebSocket connection closure
socket.addEventListener('close', event => {
  console.log('Disconnected from chat server');
  setTimeout(connect, 4000);
});
}
connect();


function onload_billiards() {
    var gImageV = 0;
    var gGuessV = 0;


    function tick(t) {
        $("#timer").animate({ val: t }, {
        duration: 200,
        easing: 'linear',
        step: function(val) {
            $("#timer").val(val);
        }});
    }

    function register() {
        socket.send(JSON.stringify({"Login" : {"username": gName}}));
        $('#game').show();
        $('#login').hide();
        on_visible();
    }

    function sendGuess(g) {
        socket.send(JSON.stringify({"Guess": {"username": gName, "guess": g}}));
    }

    function sendDrawing() {
        if (gDrawer === gName) {
            var dataURL = canvas.toDataURL();
            socket.send(JSON.stringify({"Image": {"username": gName, "image": dataURL}}));
        }
    }

    $('#canvas').on('touchend mouseleave mouseup', function(e) {
        e.preventDefault();
        sendDrawing();
    });

    $("#name").on("keydown", function search(e) {
        if(e.keyCode == 13) {
            gName = $('#name').val();
            register();
        }
    });
    $("#guess").on("keydown", function search(e) {
        if(e.keyCode == 13) {
            sendGuess($('#guess').val());
            $('#guess').val('');
        }
    });
    setInterval(function () {tick($("#timer").val()-1);}, 1000);
}
