var canvas;
var context;
var strokes = new Array();
var redraw = null;
var redraw_other = null;
var load_drawing = null;

function clear_canvas() {
    strokes.length = 0;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function see_element(element) {
    /*$('#answers').css("max-height", $('#answers').height()+"px");*/
    let mw = window.innerHeight - document.getElementById("controls").offsetHeight*4 - element.getBoundingClientRect().top;
    
    $(element).height(mw);
    $(element).width(mw);
    element.setAttribute('width', mw);
    element.setAttribute('height', mw);
    //$('#picture').hide();
    redraw();
}


function on_visible() {
    see_element(canvas);
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
        //if (gDrawer !== gName) return;

        TRACEBACK = 0;
        paint = true;
        var border = getComputedStyle(this).getPropertyValue('border-left-width');
        border = parseInt(border);
        var touches = e.originalEvent.changedTouches;
        if (touches) {
            addClick((touches[0].pageX - this.offsetLeft - border) / context.canvas.width * 1000,
                     (touches[0].pageY - this.offsetTop - border) / context.canvas.height * 1000,
                     color,
                     size,
                     mode);
        } else {
            addClick((e.pageX - this.offsetLeft - border) / context.canvas.width * 1000,
                     (e.pageY - this.offsetTop - border) / context.canvas.height * 1000,
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
                addClick((touches[0].pageX - this.offsetLeft - b) / context.canvas.width * 1000,
                         (touches[0].pageY - this.offsetTop - b) / context.canvas.height * 1000,
                         color,
                         size,
                         mode,
                         true);
            } else {
                addClick((e.pageX - this.offsetLeft - b) / context.canvas.width * 1000,
                         (e.pageY - this.offsetTop - b) / context.canvas.height * 1000,
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
            var len = strokes.length;
            strokes = strokes.slice(0, strokes[strokes.length - 1]["t"]);
            redraw();
            gUndo(strokes.length - len);
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

    redraw = function(){
        redraw_other(context, strokes);
    }

    redraw_other = function(ctx, stks){
        //if (gDrawer !== gName) {
        //    return;
        //}
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineJoin = "round";
                
        for(var i=0; i < stks.length; i++) {		
            ctx.strokeStyle = stks[i]["c"];
            ctx.lineWidth = stks[i]["s"];
            ctx.globalCompositeOperation = stks[i]["m"];
            ctx.beginPath();
            if(stks[i]["d"] && i){
                ctx.moveTo(stks[i-1]["x"]*ctx.canvas.width/1000, stks[i-1]["y"]*ctx.canvas.height/1000);
            } else {
                ctx.moveTo(stks[i]["x"]*ctx.canvas.width/1000-1, stks[i]["y"]*ctx.canvas.height/1000);
            }
            ctx.lineTo(stks[i]["x"]*ctx.canvas.width/1000, stks[i]["y"]*ctx.canvas.height/1000);
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    load_drawing = function(strks) {
        strokes = strks.map(x => JSON.parse(x));
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
