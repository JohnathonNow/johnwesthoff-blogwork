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
            var toRet = new Node("function", "function");
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
            if (num === "-") {
                return new Node("identifer", num);
            } else {
                return new Node("float", parseFloat(num));
            }
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

var globals = {};

function eval(root) {
    var stack = [globals];
    function _eval(n) {
    switch (n.type) {
        case "string":
        case "float":
        case "boolean":
        case "code":
            n.eval = n;
            return n;
        case "list":
            for (var i = 0; i < n.children.length; i++) {
                _eval(n.children[i]);
            }
            n.eval = n;
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
            if (n.children[0].type !== "function") {
                switch (n.children[0].value) {
                    case "fun":
                        _eval(n.children[1]);
                        n.eval = new Node("code", "");
                        n.eval.context = stack[stack.length - 1];
                        n.eval.children = n.children.slice(1);
                        n.eval.eval = n.eval;
                    break;
                    case "def":
                        var pairs = _eval(n.children[1]).eval.children;
                        for (var i = 1; i < pairs.length; i+=2) {
                            _eval(pairs[i]);
                        }
                        var frame = {};
                        for (var i = 0; i < pairs.length; i+=2) {
                            frame[pairs[i].value] = pairs[i+1].eval;
                        }
                        stack.push(frame);
                        n.eval = _eval(n.children[2]).eval;
                        stack.pop();
                    break;
                    case "g":
                        for (var i = 1; i < n.children.length; i+=2) {
                            globals[n.children[i].value] = 
                                    _eval(n.children[i+1]).eval;
                        }
                    break;
                    case "-":
                        n.eval = _eval(n.children[1]).eval.value;
                        for (var i = 2; i < n.children.length; i++) {
                            n.eval -= _eval(n.children[i]).eval.value;
                        }
                        n.eval = new Node("float", n.eval);
                    break;
                    case "+":
                        n.eval = 0;
                        for (var i = 1; i < n.children.length; i++) {
                            n.eval += _eval(n.children[i]).eval.value;
                        }
                        n.eval = new Node("float", n.eval);
                    break;
                    case "=":
                        n.eval = new Node("boolean", 
                            _eval(n.children[2]).eval.value === 
                            _eval(n.children[1]).eval.value);
                    break;
                    case "do":
                        for (var i = 1; i < n.children.length; i++) {
                            n.eval = _eval(n.children[i]).eval;
                        }
                    break;
                    case "if":
                        var cond = _eval(n.children[1]).eval.value;
                        if (cond === false) {
                            n.eval = _eval(n.children[3]).eval;
                        } else {
                            n.eval = _eval(n.children[2]).eval;
                        }
                    break;
                    case "car":
                        n.eval = _eval(n.children[1]).eval.children[0].eval;
                    break;
                    case "cdr":
                        n.eval = new Node("list", "");
                        n.eval.children = _eval(n.children[1]).
                                          eval.children.slice(1);
                        n.eval.eval = n.eval;
                    break;
                    case "cons":
                        var b = _eval(n.children[n.children.length - 1]).eval;
                        for (var i = 1; i < n.children.length - 1; i++) {
                            b.children.push(_eval(n.children[i]).eval);
                        }
                        n.eval = b;
                    break;
                    default:
                        for (var i = stack.length - 1; i >= 0; i--) {
                            if (n.children[0].value in stack[i]) {
                                n.children[0] = stack[i][n.children[0].value];
                                break;
                            }
                        }
                    case "":
                        var vars = _eval(n.children[0].children[0]).eval;
                        var vals = n.children.slice(1);
                        var frame = {};
                        for (var i = 0; i < vals.length; i += 1) {
                            frame[vars.children[i].value] = _eval(vals[i]).eval;
                        }
                        stack.push(frame);
                        n.eval = _eval(n.children[0].children[1]).eval;
                        stack.pop();
                    break;
                }} else {
                    n.eval = _eval(n.children[0]).eval;
                    var vars = _eval(n.eval.children[0]).eval;
                    var vals = n.children.slice(1);
                    var frame = n.eval.context;
                    console.log(frame);
                    for (var i = 0; i < vals.length; i += 1) {
                        frame[vars.children[i].value] = _eval(vals[i]).eval;
                    }
                    stack.push(frame);
                    n.eval = _eval(n.eval.children[1]).eval;
                    stack.pop();
                }
            return n;
    }
    }
    return _eval(root);
}
