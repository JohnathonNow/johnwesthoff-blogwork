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
            if (code[0] == "(") {
                var toRet = new Node("function", "user");
                toRet.eval = _parse();
                while (code[0] !== ")" && code[0]) {
                    toRet.children.push(_parse());
                }
                return toRet;
            } else {
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
            }
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
        } else if (c === '#') {
            var toRet = new Node("boolean", (code[0] === "t"));
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
            case "boolean":
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
                    case "fun":
                        _eval(n.children[0]);
                        n.eval = new Node("function", "user");
                        n.eval.eval = n.children[1];
                        n.eval.children = n.children;
                    break;
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
                    case "-":
                        n.eval = _eval(n.children[i]).eval;
                        for (var i = 1; i < n.children.length; i++) {
                            n.eval -= _eval(n.children[i]).eval;
                        }
                    break;
                    case "+":
                        n.eval = 0;
                        for (var i = 0; i < n.children.length; i++) {
                            n.eval += _eval(n.children[i]).eval;
                        }
                    break;
                    case "=":
                        n.eval = _eval(n.children[0]).eval === 
                            _eval(n.children[1]).eval;
                    break;
                    case "do":
                        for (var i = 0; i < n.children.length; i++) {
                            n.eval = _eval(n.children[i]).eval;
                        }
                    break;
                    case "if":
                        var cond = _eval(n.children[0]).eval;
                        if (cond === false) {
                            n.eval = _eval(n.children[2]).eval;
                        } else {
                            n.eval = _eval(n.children[1]).eval;
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
                            _eval(n.children[n.children.length - 1]).eval;
                        for (var i = 0; i < n.children.length - 1; i++) {
                            n.eval.children.push(_eval(n.children[i]).eval);
                        }
                        n.eval.eval = n.eval.children;
                    break;
                    default:
                        for (var i = stack.length - 1; i >= 0; i--) {
                            if (n.value in stack[i]) {
                                n.eval = stack[i][n.value];
                                break;
                            }
                        }
                    case "user":
                        var vars = _eval(n.eval.children[0]).eval;
                        var vals = n.children;
                        var frame = {};
                        for (var i = 0; i < vals.length; i+=1) {
                            frame[vars[i].value] = _eval(vals[i]).eval;
                        }
                        stack.push(frame);
                        n.eval = _eval(n.eval.children[1]).eval;
                        stack.pop();
                    break;
                }
                return n;
        }
    }
    return _eval(root);
}
console.log(eval(parse("(cons 1 2 3 '())")));
console.log(eval(parse("(car (def '(t (fun '(x) (if (= x 10) '(0) (cons x (t (+ 1 x))))) x 0) (t x)))")));
