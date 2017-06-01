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
            var id = c;
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
    var stack = [];
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
            case "identifier":
                for (var i = stack.length - 1; i >= 0; i--) {
                    if (n.value in stack[i]) {
                        n.eval = stack[i][n.value];
                        return n;
                    }
                }
                return n;
            case "function":
                switch (n.value) {
                    case "def":
                        var pairs = _eval(n.children[0]).eval;
                        for (var i = 1; i < pairs.length; i+=2) {
                            _eval(pairs[i]);
                        }
                        var frame = {};
                        for (var i = 0; i < pairs.length; i+=2) {
                            frame[pairs[i].value] = pairs[i+1].eval;
                        }
                        stack.push(frame);
                        n.eval = _eval(n.children[1]);
                        stack.pop();
                    break;
                    case "+":
                        n.eval = 0;
                        for (var i = 0; i < n.children.length; i++) {
                            n.eval += _eval(n.children[i]).eval;
                        }
                    break;
                    case "car":
                        _eval(n.children[0]);
                        n.eval = n.children[0].eval[0].eval;
                    break;
                    case "cdr":
                        _eval(n.children[0]);
                        n.eval = n.children[0].eval.slice(1);
                    break;
                    case "cons":
                        n.eval = new Node("list", "");
                        n.eval.children =
                            n.children[n.children.length - 1].children.slice();
                        for (var i = 0; i < n.children.length - 1; i++) {
                            n.eval.children.push(n.children[i]);
                        }
                        _eval(n.eval);
                    break;
                    default:
                    
                    break;
                }

                return n;
        }
    }
    return _eval(root);
}
console.log(parse("(die \"123\\\"\" (hi 1.2) 1 -4 '(1 2 3 '(4 5 6)))"));
console.log(eval(parse("(cdr '((+ 1 2 3) 5 (+ (+ 1 2) 3))")));
console.log(eval(parse("(cons 1 2 3 '(0))")));
console.log((parse("(+ x 1)")));
console.log(eval(parse("(def '(x 1 y 2) (def '(x 4) (+ x y)))")));
