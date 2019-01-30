var gDrawer = null
var gName = null;

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
        $.ajax({
            url: "/guess",
            type: "POST",
            data: {"name": gName },
            success: function (response) {
                getGuesses();
                getDrawing();
                $('#game').show();
                $('#login').hide();
                on_visible();
            },
            error: function (e) {
                setTimeout(register, 1000);
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
                setTimeout(function() {sendGuess(g);}, 1000);
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
