export class UserListItem {
    constructor(player, parent) {
        this.element = document.createElement('li');
        his.element.textContent = player;
        this.parent = parent;
        his.element.classList.add('user-list-item');
        his.element.onclick = parent.onClickBind.bind(this);
    }
}
export class UserList extends EventTarget {
    constructor(container, sortFn) {
        super();
        this.container = container;
        this.order = [];
        this.map = new Map();
        this.sortFn = sortFn;
        this.onClickBind = this.onClick.bind(this);
    }
    add(player) {
        if (!this.map.contains(player)) {
            this.map.set(player, new UserListItem(player, this));
            this.dispatchEvent(new CustomEvent("change", {detail: {added: player}}));
            this.order.push(player);
            this.sort();
        }
        return this.map.get(player);
    }
    get(player) {
        return this.map.get(player);
    }
    onClick(target, e) {
        this.dispatchEvent(new CustomEvent("click", {detail: {event: e, target: target}}));
    }
    sort() {
        this.order.sort(this.sortFn);
        for (var player of this.order) {
            this.container.appendChild(this.map.get(player));
        }
    }
    setAttribute(player, property, value) {
        const listItem = this.add(player);
        listItem.setAttribute(property, value);
    }
    animateBool(player, property) {
        const listItem = this.add(player);
        listItem.setAttribute(property, "true");  
        listItem.setAttribute("moving"+property, "true");  
        setTimeout(function() {listItem.setAttribute("moving"+property, "false");}, 1);
    }
    clear() {
        this.container.innerHTML = "";
    }
}