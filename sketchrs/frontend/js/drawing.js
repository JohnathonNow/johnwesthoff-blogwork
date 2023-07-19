export class Gallery extends EventTarget {
    constructor(container, controls, mainPlayer) {
        this.container = container;
        this.controls = controls;
        this.map = new Map();
    }
    add(player, addControls=false) {
        if (!this.map.contains(player)) {
            let newCanvasElement = document.createElement("canvas");
            this.map.set(player, new Canvas(newCanvasElement, this.controls, addControls));
            newCanvasElement.classList = "image";
            this.container.appendChild(newCanvasElement);
            this.dispatchEvent(new CustomEvent("change", {detail: {added: player}}));
        }
        return this.map.get(player);
    }
    get(player) {
        return this.map.get(player);
    }
    clear() {
        for (var canvas of this.map.values()) {
            canvas.clearCanvas();
        }
    }
}

export const PENCIL_MODE = "source-over";
export const ERASE_MODE = "destination-out;"
export class Canvas extends EventTarget {
    constructor(canvas_element, controls_element, add_controls=false) {
        super();
        this.strokes = new Array();
        this.canvas_element = canvas_element;
        this.context = this.canvas_element.getContext("2d");
        this.controls_element = controls_element;

        this.paint = false;
        this.color = "#000000";
        this.size = 5;
        this.traceback = 0;

        this.mode = PENCIL_MODE;


        this.canvas_element.ontouchstart = this.canvas_element.onmousedown = e => this.onTouch(e);
        this.canvas_element.ontouchmove = this.canvas_element.onmousemove = e => this.onUntouch(e);
        this.canvas_element.ontouchend = this.canvas_element.onmouseleave = this.canvas_element.onmouseup = e => {
            this.redraw();
            this.paint = false;
            this.dispatchEvent(new CustomEvent("stroke"));
        };

        if (add_controls) {
            this.controls = {
                color: document.createElement("input"),
                stroke: document.createElement("input"),
                erase: document.createElement("button"),
                pencil: document.createElement("button"),
                undo: document.createElement("button")
            };

            this.controls.color.type = "color";
            this.controls.color.classList.add("colorpicker");
            this.controls.stroke.type = "range";
            this.controls.stroke.value = "5";
            this.controls.stroke.min = "1";
            this.controls.stroke.max = "50";
            this.controls.stroke.classList.add("sizepicker");
            this.controls.erase.classList.add("erasebutton");
            this.controls.erase.innerHTML = "Erase";
            this.controls.pencil.classList.add("pencilbutton");
            this.controls.pencil.innerHTML = "Draw";
            this.controls.undo.classList.add("undobutton");
            this.controls.undo.innerHTML = "Undo";


            controls_element.appendChild(document.createTextNode("Color: "));
            controls_element.appendChild(this.controls.color);
            controls_element.appendChild(document.createTextNode("Stroke: "));
            controls_element.appendChild(this.controls.stroke);
            controls_element.appendChild(this.controls.erase);
            controls_element.appendChild(this.controls.pencil);
            controls_element.appendChild(this.controls.undo);
            this.controls.color.onchange = e => {
                this.mode = PENCIL_MODE;
                this.color = e.target.value;
            };
            this.controls.stroke.onchange = e => {
                this.size = e.target.value;
            };
            this.controls.undo.onclick = e => this.undo(e);
            this.controls.pencil.onclick = e => this.pencil(e);
            this.controls.erase.onclick = e => this.erase(e);
        }
    }

    getStrokes() {
        return this.strokes;
    }

    clearCanvas() {
        this.strokes.length = 0;
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.dispatchEvent(new CustomEvent("change"));
    }

    getCanvas() {
        return this.canvas_element;
    }

    redraw() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        this.context.lineJoin = "round";

        for (var i = 0; i < this.strokes.length; i++) {
            this.context.strokeStyle = this.strokes[i]["c"];
            this.context.lineWidth = this.strokes[i]["s"];
            this.context.globalCompositeOperation = this.strokes[i]["m"];
            this.context.beginPath();
            if (this.strokes[i]["d"] && i) {
                this.context.moveTo(this.strokes[i - 1]["x"] * this.context.canvas.width / 1000, this.strokes[i - 1]["y"] * this.context.canvas.height / 1000);
            } else {
                this.context.moveTo(this.strokes[i]["x"] * this.context.canvas.width / 1000 - 1, this.strokes[i]["y"] * this.context.canvas.height / 1000);
            }
            this.context.lineTo(this.strokes[i]["x"] * this.context.canvas.width / 1000, this.strokes[i]["y"] * this.context.canvas.height / 1000);
            this.context.closePath();
            this.context.stroke();
        }
        this.dispatchEvent(new CustomEvent("redraw"));
    }

    setSize() {
        let oh = this.controls_element ? this.controls_element.offsetHeight * 1.5 : 0;
        let mw = window.innerHeight - oh - this.canvas_element.getBoundingClientRect().top;

        this.canvas_element.style.width = mw;
        this.canvas_element.style.height = mw;
        this.canvas_element.setAttribute('width', mw);
        this.canvas_element.setAttribute('height', mw);

        this.redraw();
    }

    onTouch(e) {
        e.preventDefault();

        this.traceback = 0;
        this.paint = true;
        var border = getComputedStyle(e.target).getPropertyValue('border-left-width');
        border = parseInt(border);
        var touches = e.changedTouches;
        if (touches) {
            this.addClick((touches[0].pageX - e.target.offsetLeft - border) / this.context.canvas.width * 1000,
                (touches[0].pageY - e.target.offsetTop - border) / this.context.canvas.height * 1000,
                this.color,
                this.size,
                this.mode);
        } else {
            this.addClick((e.pageX - e.target.offsetLeft - border) / this.context.canvas.width * 1000,
                (e.pageY - e.target.offsetTop - border) / this.context.canvas.height * 1000,
                this.color,
                this.size,
                this.mode);
        }
        this.redraw();
    }

    onUntouch(e) {
        e.preventDefault();
        if (this.paint) {
            var b = getComputedStyle(e.target).getPropertyValue('border-left-width');
            b = parseInt(b);
            var touches = e.changedTouches;
            if (touches) {
                this.addClick((touches[0].pageX - e.target.offsetLeft - b) / this.context.canvas.width * 1000,
                    (touches[0].pageY - e.target.offsetTop - b) / this.context.canvas.height * 1000,
                    this.color,
                    this.size,
                    this.mode,
                    true);
            } else {
                this.addClick((e.pageX - e.target.offsetLeft - b) / this.context.canvas.width * 1000,
                    (e.pageY - e.target.offsetTop - b) / this.context.canvas.height * 1000,
                    this.color,
                    this.size,
                    this.mode,
                    true);
            }
            this.redraw();
        }
    }

    pencil() {
        this.mode = PENCIL_MODE;
        this.dispatchEvent(new CustomEvent("pencil"));
    }

    erase() {
        this.color = "rgba(0,0,0,1)";
        this.mode = ERASE_MODE;
        this.dispatchEvent(new CustomEvent("erase"));
    }

    undo() {
        if (this.strokes.length > 0) {
            var len = this.strokes.length;
            this.strokes = this.strokes.slice(0, this.strokes[this.strokes.length - 1]["t"]);
            this.redraw();
            this.dispatchEvent(new CustomEvent("undo", { detail: { newlength: this.strokes.length } }));
        }
    }

    addClick(x, y, c, s, m, dragging) {
        this.strokes.push({
            "x": x,
            "y": y,
            "c": c,
            "s": s,
            "m": m,
            "d": dragging,
            "t": --this.traceback
        });
        this.dispatchEvent(new CustomEvent("change"));
    }

    load(strks) {
        this.strokes = strks.map(x => JSON.parse(x));
        this.dispatchEvent(new CustomEvent("change"));
    }

    add(image) {
        this.strokes = this.strokes.concat(image.map(x => JSON.parse(x)));
        this.dispatchEvent(new CustomEvent("change"));
    }

    hide() {
        if (this.canvas_element.style.display != "none") {
            this.old_display = this.canvas_element.style.display;
        }
        this.canvas_element.style.display = "none";
        this.dispatchEvent(new CustomEvent("hidden"));
    }

    show() {
        this.canvas_element.style.display = this.old_display || "block";
        this.dispatchEvent(new CustomEvent("shown"));
    }
}