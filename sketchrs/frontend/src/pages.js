export class Pages extends EventTarget {
    constructor() {
        super();
        this.map = new Map();
    }
    addPage(name, page, style="block") {
        this.map.insert(name, [page, style]);
    }
    goTo(name) {
        this.map.values().forEach(x=>x.style.display = "none");
        const [page, style] = this.map.get(name);
        page.style.display = style;
    }
}