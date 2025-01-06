var canvas;
var context;
var strokes = new Array();
var redraw = null;
var redraw_other = null;
var load_drawing = null;

const cssTo32BitColor = function() {
  let ctx;
  return function(cssColor) {
    if (!ctx) {
      ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = 1;
      ctx.canvas.height = 1;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const imgData = ctx.getImageData(0, 0, 1, 1);
    return new Uint32Array(imgData.data.buffer)[0];
  };
}();

const gradientColors = [
    "red",
    "brown",
    "SaddleBrown",
    "darkorange",
    "orange",
    "gold",
    "yellow",
    "lightgreen",
    "limegreen",
    "green",
    "teal",
    "lightblue",
    "cyan",
    "blue",
    "indigo",
    "purple",
    "RebeccaPurple",
    "lightcoral",
    "pink",
    "white",
    "gray",
    "black"
];

function clear_canvas() {
    strokes.length = 0;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function see_element(element) {
    let mw = window.innerHeight - document.getElementById("controls").offsetHeight*1.5 - element.getBoundingClientRect().top;
    element.style.width = mw;
    element.style.height = mw;
    element.setAttribute('width', mw);
    element.setAttribute('height', mw);
    redraw();
}


function on_visible() {
    see_element(canvas);
}

function onload_drawing() {
    var DRAW_MODE;
    var paint;
    var tool = "paint";
    var color = "#000000";
    var size = 5;
    var mode;
    var TRACEBACK = 0;

    let colorpicker = document.getElementById('colorpicker');
    for (const c of gradientColors) {
        let ce = document.createElement("div");
        ce.style["background-color"] = c;
        ce.classList.add("colorchoice");
        ce.onclick = function(e) {
            mode = DRAW_MODE;
            color = c;
            // Select all elements with the class "myClass"
            const elements = document.querySelectorAll('.colorpicked');

            // Loop through the elements and remove the class
            for (const element of elements) {
                element.classList.remove('colorpicked');
            }
            ce.classList.add("colorpicked");
        }
        colorpicker.appendChild(ce);
    }
    canvas = document.getElementById('canvas');
    context = canvas.getContext("2d");
    DRAW_MODE = context.globalCompositeOperation;
    mode = DRAW_MODE;
    var touch = function(e){
        e.preventDefault();
        e.stopPropagation();
        TRACEBACK = 0;
        paint = true;
        border = parseInt(border);
        var touches = e.touches;
        if (touches) {
            var border = getComputedStyle(this).getPropertyValue('border-left-width');
            var rect = e.target.getBoundingClientRect();
            addClick((touches[0].pageX + border + rect.left) / context.canvas.offsetWidth * 1000,
                (touches[0].pageY + border + rect.top) / context.canvas.offsetHeight * 1000,
                color,
                size,
                mode,
                tool);
        } else {
            var border = getComputedStyle(e.target).getPropertyValue('border-left-width');
            if (tool == "flood") {
                //floodFill(context, e.offsetX + border, e.offsetY + border, color);
            }
            addClick((e.offsetX + border) / context.canvas.offsetWidth * 1000,
                (e.offsetY + border) / context.canvas.offsetHeight * 1000,
                color,
                size,
                mode, 
                tool);
        }
        redraw();
    }

    var maybetouch = function(e){
        if (e.buttons == 1) {
            touch(e);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    var untouch = function(e){
        e.preventDefault();
        if (paint) {
            var b = getComputedStyle(this).getPropertyValue('border-left-width');
            b = parseInt(b);
            var touches = e.changedTouches;
            if (touches) {
                var rect = e.target.getBoundingClientRect();
                addClick((touches[0].pageX + b - rect.left) / context.canvas.offsetWidth * 1000,
                    (touches[0].pageY + b - rect.top) / context.canvas.offsetHeight * 1000,
                    color,
                    size,
                    mode,
                    tool,
                    true);
            } else {
                addClick((e.offsetX + b) / context.canvas.offsetWidth * 1000,
                    (e.offsetY + b) / context.canvas.offsetHeight * 1000,
                    color,
                    size,
                    mode,
                    tool,
                    true);
            }
            redraw();
        }
    }

    function pencil()
    {
        mode = DRAW_MODE;
        tool = "paint";
    }

    function erase()
    {
        color = "rgba(0,0,0,1)";
        mode = "destination-out";
        tool = "paint";
    }

    function flood()
    {
        tool = "flood";
    }


function getPixel(pixelData, x, y) {
  if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
    return -1;  // impossible color
  } else {
    return pixelData.data[y * pixelData.width + x];
  }
}

function floodFill(ctx, x, y, fillColor) {
    x = Math.floor(x);
    y = Math.floor(y);
  // read the pixels in the canvas
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

  // make a Uint32Array view on the pixels so we can manipulate pixels
  // one 32bit value at a time instead of as 4 bytes per pixel
  const pixelData = {
    width: imageData.width,
    height: imageData.height,
    data: new Uint32Array(imageData.data.buffer),
  };

  // get the color we're filling
  const targetColor = getPixel(pixelData, x, y);

  // check we are actually filling a different color
  if (targetColor !== fillColor) {
    const spansToCheck = [];

    function addSpan(left, right, y, direction) {
      spansToCheck.push({left, right, y, direction});
    }

    function checkSpan(left, right, y, direction) {
      let inSpan = false;
      let start;
      let x;
      for (x = left; x < right; ++x) {
        const color = getPixel(pixelData, x, y);
        if (color === targetColor) {
          if (!inSpan) {
            inSpan = true;
            start = x;
          }
        } else {
          if (inSpan) {
            inSpan = false;
            addSpan(start, x - 1, y, direction);
          }
        }
      }
      if (inSpan) {
        inSpan = false;
        addSpan(start, x - 1, y, direction);
      }
    }

    addSpan(x, x, y, 0);

    while (spansToCheck.length > 0) {
      const {left, right, y, direction} = spansToCheck.pop();

      // do left until we hit something, while we do this check above and below and add
      let l = left;
      for (;;) {
        --l;
        const color = getPixel(pixelData, l, y);
        if (color !== targetColor) {
          break;
        }
      }
      ++l

      let r = right;
      for (;;) {
        ++r;
        const color = getPixel(pixelData, r, y);
        if (color !== targetColor) {
          break;
        }
      }

      const lineOffset = y * pixelData.width;
      pixelData.data.fill(fillColor, lineOffset + l, lineOffset + r);

      if (direction <= 0) {
        checkSpan(l, r, y - 1, -1);
      } else {
        checkSpan(l, left, y - 1, -1);
        checkSpan(right, r, y - 1, -1);
      }

      if (direction >= 0) {
        checkSpan(l, r, y + 1, +1);
      } else {
        checkSpan(l, left, y + 1, +1);
        checkSpan(right, r, y + 1, +1);
      }
    }
    // put the data back
    ctx.putImageData(imageData, 0, 0);
  }
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

    function addClick(x, y, c, s, m, t, dragging)
    {
        strokes.push({ "x": x,
            "y": y,
            "c": c,
            "s": s,
            "m": m,
            "o": t,
            "d": dragging,
            "t": --TRACEBACK});
    }

    redraw = function(){
        redraw_other(context, strokes);
    }

    redraw_other = function(ctx, stks){
        //return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineJoin = "round";

        for(var i=0; i < stks.length; i++) {		
            if (stks[i]["o"] == "flood") {
                floodFill(ctx, stks[i]["x"]*ctx.canvas.width/1000, stks[i]["y"]*ctx.canvas.height/1000, cssTo32BitColor(stks[i]["c"]));
            } else {
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
    }

    load_drawing = function(strks) {
        strokes = strks.map(x => JSON.parse(x));
    }

    document.getElementById("canvas").ontouchstart = document.getElementById("canvas").onmousedown = touch;
    document.getElementById("canvas").onmouseenter = maybetouch;
    document.getElementById("canvas").ontouchmove = document.getElementById("canvas").onmousemove = untouch;
    document.getElementById("canvas").ontouchend = document.getElementById("canvas").onmouseleave = document.getElementById("canvas").onmouseup = function(e) {
        e.preventDefault();
        redraw();
        paint = false;

    };
    document.getElementById("size").onchange = function(e) { 
        size = e.target.value;
    };
    document.getElementById("undo").onclick = undo;
    document.getElementById("pencil").onclick = pencil;
    document.getElementById("flood").onclick = flood;
    document.getElementById("erase").onclick = erase;
}
