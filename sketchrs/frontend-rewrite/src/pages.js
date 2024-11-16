export class Pages extends EventTarget {
    constructor() {
        super();
        this.map = new Map();
    }
    addPage(name, page, style="block") {
        this.map.set(name, [page, style]);
    }
    goTo(name) {
        for (let [key, value] of this.map) {
            value[0].style.display = "none";
        }
        const [page, style] = this.map.get(name);
        page.style.display = style;
    }
}
