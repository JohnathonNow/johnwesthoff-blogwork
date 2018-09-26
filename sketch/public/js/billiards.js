var gDrawer = null
var gName = null;

function onload_billiards() {
    var gImageV = 0;
    var gGuessV = 0;

    function getDrawing() {
        $.ajax({
            url: "/rest/"+gImageV,
            type: "POST",
            success: function (d) {
                var response = JSON.parse(d)['payload'];
                gImageV = response['version'];
                if (gDrawer !== gName) {
                    var newImg = document.createElement("img");
                    newImg.setAttribute('src', response['image']);
                    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                    context.drawImage(newImg,0,0,420,420);
                }
                setTimeout(getDrawing, 10);
            },
            error: function (e) {
                setTimeout(getDrawing, 1000);
            }
        });
    }

    function getGuesses() {
        $.ajax({
            url: "/guess/"+gGuessV+"/"+gName,
            type: "GET",
            success: function (d) {
                var response = JSON.parse(d);
                var messages = response["messages"];
                var msges = '';
                for (var i = 0; i < messages.length; i++) {
                    if (messages[i].name === "") {
                        msges += '<b class="warn">' + messages[i].message + '</b><br>'
                    } else {
                        msges += '<b>' + messages[i].name + ':</b> ' + messages[i].message + '<br>'
                    }
                }
                $('#answers').html($('#answers').html() + msges);
                gGuessV = response['payload']["version"]; 
                gDrawer = response['payload']["drawer"]; 
                setTimeout(getGuesses, 10);
            },
            error: function (e) {
                console.log(e);
                setTimeout(getGuesses, 1000);
            }
        });
    }

    function register() {
        $.ajax({
            url: "/guess",
            type: "POST",
            data: {"name": gName },
            success: function (d) {
                getGuesses();
                getDrawing();
            },
            error: function (e) {
                register(); //try again
            }
        });
    }

    function sendGuess(g) {
        $.ajax({
            url: "/guess",
            type: "PUT",
            data: {"name": gName, "guess": g},
            success: function (d) {
            },
            error: function (e) {
                sendGuess(g); //try again
            }
        });
    }

    function sendDrawing() {
        if (gDrawer === gName) {
            var dataURL = canvas.toDataURL();
            $.ajax({
                url: "/rest",
                type: "PUT",
                data: {"img": dataURL},
                success: function (d) {
                },
                error: function (e) {

                }
            });
        }
    }

    $('#canvas').on('touchend mouseleave mouseup', function(e) {
        sendDrawing();
    });
    $("#name").on("keydown", function search(e) {
        if(e.keyCode == 13) {
            gName = $('#name').val();
            register();
            $('#game').show();
            $('#login').hide();
        }
    });
    $("#guess").on("keydown", function search(e) {
        if(e.keyCode == 13) {
            sendGuess($('#guess').val());
            $('#guess').val('');
        }
    });
}
