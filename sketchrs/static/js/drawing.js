var canvas;
var context;
var strokes = new Array();

function clear_canvas() {
    strokes.length = 0;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function on_visible() {
    $('.image').height($('#canvas').width());
    $('#answers').css("max-height", $('#answers').height()+"px");
    canvas.setAttribute('width', $('#canvas').width());
    canvas.setAttribute('height', $('#canvas').height());
    $('#picture').hide();
}

function onload_drawing() {
    var DRAW_MODE;
    var paint;
    var color = "#000000";
    var size = 5;
    var mode;
    var TRACEBACK = 0;

    canvas = document.getElementById('canvas');
    context = canvas.getContext("2d");
    DRAW_MODE = context.globalCompositeOperation;
    mode = DRAW_MODE;
    var touch = function(e){
        e.preventDefault();
        if (gDrawer !== gName) return;

        TRACEBACK = 0;
        paint = true;
        var border = getComputedStyle(this).getPropertyValue('border-left-width');
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

    $('#canvas').on('touchstart mousedown', touch);
    $('#canvas').on('touchmove mousemove', untouch);
    $('#canvas').on('touchend mouseleave mouseup', function(e) {
        redraw();
        paint = false;
    } );
    $('#colorpicker').on('change', function(e) { 
        mode = DRAW_MODE;
        color = e.target.value;
    });
    $('#size').on('change', function(e) { 
        size = e.target.value;
    });
    $('#undo').on('click', undo);
    $('#pencil').on('click', pencil);
    $('#erase').on('click', erase);
}
