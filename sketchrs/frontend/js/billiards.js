var gDrawer = null
var gName = null;

var socket = null;

function connect() {
new WebSocket('ws://'+window.location.hostname+':3030/chat');

// Event listener for when the WebSocket connection is established
socket.addEventListener('open', event => {
  console.log('Connected to chat server');
});

// Event listener for incoming messages from the server
socket.addEventListener('message', event => {
  const message = event.data;
  console.log('Received message:', message);

  // Append the received message to the chat log
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  chatLog.appendChild(messageElement);
    // TODO: SOMETHING
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

// Function to send a message to the server
function sendMessage() {
  const message = messageInput.value;
  if (gUsername) {
      socket.send(JSON.stringify({"Chat": {"message": message}}));
  } else {
      gUsername = message;
      socket.send(JSON.stringify({"Login": {"username": message}}));
  }
  messageInput.value = '';
}

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key in the message input field
messageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    sendMessage();
  }
});


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

    function getDrawing() {
        $.ajax({
            url: "/rest/"+gImageV,
            type: "GET",
            success: function (response) {
                if (response['status'] === 'success') {
                    gImageV = response['payload']['version'];
                    if (gDrawer !== gName) {
                        $("#picture").attr("src",response['payload']['image']);
                    }
                    setTimeout(getDrawing, 10);
                } else {
                    gImageV = 0;
                    setTimeout(getDrawing, 1000);
                }
            },
            error: function (e) {
                console.log(e);
                setTimeout(getDrawing, 1000);
            }
        });
    }

    function getGuesses() {
        $.ajax({
            url: "/guess/"+gGuessV+"/"+gName,
            type: "GET",
            success: function (response) {
                tick(response['payload']['time']);
                var messages = response['messages'];
                var msges = '';
                for (var i = 0; i < messages.length; i++) {
                    if (messages[i].kind === "word") {
                        clear_canvas();
                    }
                    if (messages[i].name === "") {
                        msges += '<b class="warn">' + messages[i].message + '</b><br>'
                    } else {
                        msges += '<b>' + messages[i].name + ':</b> ' + messages[i].message + '<br>'
                    }
                }
                $('#answers').html($('#answers').html() + msges);
                gGuessV = response['payload']["version"]; 
                gDrawer = response['payload']["drawer"]; 
                if (gDrawer === gName) {
                    $('#picture').hide();
                    $('#canvas').show();
                } else {
                    $('#picture').show();
                    $('#canvas').hide();
                }
                $("#answers").stop();
                $("#answers").animate({scrollTop:$("#answers")[0].scrollHeight}, 500);
                setTimeout(getGuesses, 10);
            },
            error: function (e) {
                setTimeout(getGuesses, 1000);
            }
        });
    }

    function register() {
        socket.send({"Login" : {"username": gName}});
    }

    function sendGuess(g) {
        socket.send({"Guess": {"username": gName, "guess": g}});
    }

    function sendDrawing() {
        if (gDrawer === gName) {
            var dataURL = canvas.toDataURL();
            socket.send{({"Image": {"usernane": gName, "img": dataURL}});
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
