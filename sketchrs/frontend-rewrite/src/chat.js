export const MAX_CHAT = 30;

export class Chat extends EventTarget {
    constructor(container, input) {
        super();
        this.container = container;
        this.input = input;
    }
    chat(player, message) {
        let line = document.createElement("div");
        let user = document.createElement("b");
        user.textContent = player + ": ";
        line.append(user, message, document.createElement("br"));
        this.container.append(line);
        while (this.container.children.length > MAX_CHAT) {
            this.container.removeChild(chat.children[0]);
        }
        this.container.scrollTop = this.container.scrollHeight;
        return line;
    }
    announce(message) {
        let line = document.createElement("div");
        let msg = document.createElement("b");
        msg.classList = "warn";
        msg.textContent = message;
        line.append(msg, document.createElement("br"));
        this.container.append(line);
        while (this.container.children.length > MAX_CHAT) {
            this.container.removeChild(chat.children[0]);
        }
        this.container.scrollTop = this.container.scrollHeight;
        return line;
    }
}