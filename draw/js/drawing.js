var canvas;
var context;
var strokes = new Array();
var DRAW_MODE;
var paint;
var color = "#000000";
var size = 5;
var mode;
var TRACEBACK = 0;

function loaded() {
    canvas = document.getElementById('canvas');
    canvas.setAttribute('width', 420);
    canvas.setAttribute('height', 420);
    context = canvas.getContext("2d");
    DRAW_MODE = context.globalCompositeOperation;
    mode = DRAW_MODE;
    var touch = function(e){
        e.preventDefault();
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
            var b = getComputedStyle(this).getPropertyValue('border-width');
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
    $('#canvas').on('touchend mouseleave mouseup', function(e) { paint = false } );
    $('#colorpicker').on('change', function(e) { 
        mode = DRAW_MODE;
        color = e.target.value;
    });
    $('#size').on('change', function(e) { 
        size = e.target.value;
    });
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
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
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

function send() {
	var dataURL = canvas.toDataURL();
    $.ajax({
        url: "http://johnwesthoff.com:31111",
        type: "POST",
		data: {"image": dataURL},
        success: function (d) {
            location.reload(true);
            //var img = $('<img>');
            //img.attr('src', d.image);
            //img.appendTo('#imagediv');
        }
    });
}
