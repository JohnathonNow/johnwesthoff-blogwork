class Node {
    constructor(type, value) {
        this.type = type;
        this.value = value;
        this.eval = null;
        this.children = [];
    }
}

function parse(code) {
    function _parse() {
        code = code.trimLeft();
        c = code[0];
        code = code.slice(1);
        if (c === "(") {
            id = "";
            while (code[0] !== " " && code[0] !== ")") {
                id += code[0];
                code = code.slice(1);
            }
            var toRet = new Node("function", id);
            while (code[0] !== ")" && code[0]) {
                toRet.children.push(_parse());
            }
            code = code.slice(1);
            return toRet;
        } else if ((c >= "0" && c <= "9") || c == "." || c == "-") {
            num = c;
            while (code[0] !== " " && code[0] !== ")" && code[0]) {
                num += code[0];
                if (code[0] !== ")") {
                    code = code.slice(1);
                }
            }
            return new Node("float", parseFloat(num));
        } else if (c === "'" && code[0] === "(") {
            var toRet = new Node("list", "");
            code = code.slice(1);
            while (code[0] !== ")" && code[0]) {
                toRet.children.push(_parse());
            }
            code = code.slice(1);
            return toRet;
        } else if (c === "\"") {
            var str = "";
            while (code[0] !== "\"" && code[0]) {
                if (code[0] === "\\") {
                    if (code[1] === "\"") {
                        str += "\"";
                        code = code.slice(2);
                    }
                } else {
                    str += code[0];
                    code = code.slice(1);
                }
            }
            code = code.slice(1);
            return new Node("string", str);
        } else {
            var id = "";
            while (code[0] !== " " && code[0] !== ")" && code[0]) {
                id += code[0];
                if (code[0] !== ")") {
                    code = code.slice(1);
                }
            }
            return new Node("identifier", id);
        }
    }
    return _parse();
}
function eval(root) {
    function _eval(n) {
        switch (n.type) {
            case "string":
            case "float":
                n.eval = n.value;
                return n;
            case "list":
                for (var i = 0; i < n.children.length; i++) {
                    _eval(n.children[i]);
                }
                n.eval = n.children;
                return n;
        }
    }
    return _eval(root);
}
console.log(parse("(die \"123\\\"\" (hi 1.2) 1 -4 '(1 2 3 '(4 5 6)))"));
console.log(eval(parse("'(\"12\")")));
