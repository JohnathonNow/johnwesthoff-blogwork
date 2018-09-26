var canvas;
var context;
var strokes = new Array();
var DRAW_MODE;
var paint;
var color = "#000000";
var size = 5;
var mode;
var TRACEBACK = 0;


var gLocalMessages = [];
var gName = null;
var gImageV = 0;
var gGuessV = 0;
var gDrawer = "";

function loaded() {
    canvas = document.getElementById('canvas');
    canvas.setAttribute('width', 420);
    canvas.setAttribute('height', 420);
    context = canvas.getContext("2d");
    DRAW_MODE = context.globalCompositeOperation;
    mode = DRAW_MODE;
    var touch = function(e){
        e.preventDefault();
        if (gDrawer !== gName) return;

        TRACEBACK = 0;
        paint = true;
        var border = getComputedStyle(this).getPropertyValue('border-width');
        border = parseInt(border);
        var touches = e.originalEvent.changedTouches;
        if (touches) {
            addClick(touches[0].pageX - this.offsetLeft - border,
                     touches[0].pageY - this.offsetTop - border,
                     color,
                     size,
                     mode);
        } else {
            addClick(e.pageX - this.offsetLeft - border,
                     e.pageY - this.offsetTop - border,
                     color,
                     size,
                     mode);
        }
        redraw();
    }
    var untouch = function(e){
        e.preventDefault();
        if (paint) {
            var b = getComputedStyle(this).getPropertyValue('border-left-width');
            b = parseInt(b);
            var touches = e.originalEvent.changedTouches;
            if (touches) {
                addClick(touches[0].pageX - this.offsetLeft - b,
                         touches[0].pageY - this.offsetTop - b,
                         color,
                         size,
                         mode,
                         true);
            } else {
                addClick(e.pageX - this.offsetLeft - b,
                         e.pageY - this.offsetTop - b,
                         color,
                         size,
                         mode,
                         true);
            }
            redraw();
        }
    }
    $('#canvas').on('touchstart mousedown', touch);
    $('#canvas').on('touchmove mousemove', untouch);
    $('#canvas').on('touchend mouseleave mouseup', function(e) {
        paint = false;
        send();
    } );
    $('#colorpicker').on('change', function(e) { 
        mode = DRAW_MODE;
        color = e.target.value;
    });
    $('#size').on('change', function(e) { 
        size = e.target.value;
    });
    $("#name").on("keydown",function search(e) {
    if(e.keyCode == 13) {
        gName = $('#name').val();
        register();
        $('#game').show();
        $('#login').hide();
    }});
    $("#guess").on("keydown",function search(e) {
    if(e.keyCode == 13) {
        guess($('#guess').val());
        $('#guess').val('');
    }});
}

function pencil()
{
    mode = DRAW_MODE;
}

function erase()
{
    color = "rgba(0,0,0,1)";
    mode = "destination-out";
}

function undo()
{
    if (strokes.length > 0) {
        strokes = strokes.slice(0, strokes[strokes.length - 1]["t"]);
        redraw();
    }
}

function addClick(x, y, c, s, m, dragging)
{
    strokes.push({ "x": x,
                   "y": y,
                   "c": c,
                   "s": s,
                   "m": m,
                   "d": dragging,
                   "t": --TRACEBACK});
}

function redraw(){
    if (gDrawer !== gName) {
        return;
    }
    //context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.lineJoin = "round";
			
    for(var i=0; i < strokes.length; i++) {		
        context.strokeStyle = strokes[i]["c"];
        context.lineWidth = strokes[i]["s"];
        context.globalCompositeOperation = strokes[i]["m"];
        context.beginPath();
        if(strokes[i]["d"] && i){
            context.moveTo(strokes[i-1]["x"], strokes[i-1]["y"]);
        } else {
            context.moveTo(strokes[i]["x"]-1, strokes[i]["y"]);
        }
        context.lineTo(strokes[i]["x"], strokes[i]["y"]);
        context.closePath();
        context.stroke();
    }
}

function getimg() {
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
            setTimeout(getimg(), 10);
        },
        error: function (e) {
            setTimeout(getimg(), 10);
        }
    });
}

function getguesses() {
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

            for (var i = 0; i < gLocalMessages.length; i++) {
                msges += '<b class="warn">' + gLocalMessages[i] + '</b><br>'
            }

            $('#answers').html($('#answers').html() + msges);
            gGuessV = response['payload']["version"]; 
            gDrawer = response['payload']["drawer"]; 
            setTimeout(getguesses(), 10);
        },
        error: function (e) {
            console.log(e);
            setTimeout(getguesses(), 10);
        }
    });
}

function register() {
    $.ajax({
        url: "/guess",
        type: "POST",
		data: {"name": gName },
        success: function (d) {
            getguesses();
            getimg();
        },
        error: function (e) {

        }
    });
}

function guess(g) {
    $.ajax({
        url: "/guess",
        type: "PUT",
		data: {"name": gName, "guess": g},
        success: function (d) {
        },
        error: function (e) {

        }
    });
}

function send() {
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
