/*
 * =======  Bonza Framework  ========
 *     © Aha! Factor Pty Ltd, 2015
 * https://github.com/ahafactor/bonza
 * ==================================
 */
function loadBonzaLibrary(url) {

	function getChildren(node) {
		var i = 0;
		var result = [];
		for ( i = 0; i < node.childNodes.length; i++) {
			if (node.childNodes[i].nodeType != 3 || node.childNodes[i].nodeValue.trim() != "") {
				result.push(node.childNodes[i]);
			}
		}
		return result;
	}

	function firstExpr(node) {
		var first = 0;
		while (node.childNodes[first].nodeType == 3 && node.childNodes[first].nodeValue.trim() == "") {
			first++;
		}
		return node.childNodes[first];
	}

	function findChild(node, name) {
		var i = 0;
		for ( i = 0; i < node.children.length; i++) {
			if (node.children[i].nodeName === name) {
				return node.children[i];
			}
		}
		throw "Error";
	}

	function findChildren(node, name) {
		var i = 0;
		var result = [];
		for ( i = 0; i < node.children.length; i++) {
			if (node.children[i].nodeName == name) {
				result.push(node.children[i]);
			}
		}
		return result;
	}

	var core = {
		classname : function(name) {
			return "bonza-" + name;
		},
		nbsp : "&nbsp;",
		math : {
			sin : function(x) {
				return Math.sin(x);
			},
			trunc : function(x) {
				return Math.trunc(x);
			},
			NaN : function(x) {
				return isNaN(x);
			},
			finite : function(x) {
				return isFinite(x);
			}
		},
		time : {
			msec : 1.0,
			sec : 1000.0,
			date : function(d) {
				return Number(Date(d.year, d.month, d.day, 0, 0, 0, 0));
			}
		},
		format : {
			intToStr : function(i) {
				return i.toString();
			},
			numToStr : function(x) {
				return x.toString();
			},
			formatNum : function(arg) {
				if (arg.hasOwnProperty("prec")) {
					return arg.num.toPrecision(arg.prec);
				} else if (arg.hasOwnProperty("exp")) {
					return arg.num.toExponential(arg.exp);
				} else {
					return arg.num.toFixed(arg.dec);
				}
			},
			strToNum : function(s) {
				var result = parseFloat(s);
				if (isNaN(result)) {
					throw "Error";
				}
				return result;
			},
			strToInt : function(s) {
				var result = parseInt(s);
				if (isNaN(result)) {
					throw "Error";
				}
				return result;
			},
			dateToStr : function(x) {
				return Date(x).toString();
			},
		},
		string : {
			substr : function(args) {
				if (args.hasOwnProperty("length")) {
					return args.str.substr(args.start, args.length);
				} else {
					if (args.hasOwnProperty("end")) {
						return args.str.slice(args.start, args.end);
					} else {
						return args.str.slice(args.start);
					}
				}
			},
			length : function(str) {
				return str.length;
			},
			join : function(arg) {
				var result = "";
				for (var i = 0; i < arg.parts.length - 1; i++) {
					result = result.concat(arg.parts[i], arg.sep);
				}
				return result.concat(arg.parts[arg.parts.length - 1]);
			},
			split : function(arg) {
				return arg.str.split(arg.sep);
			},
			repeat : function(arg) {
				var result = "";
				for (var i = 0; i < arg.times; i++) {
					result.concat(arg.str);
				}
				return result;
			},
			charAt : function(arg) {
				return arg.str.charAt(arg.pos);
			},
			trim : function(str) {
				return str.trim();
			}
		},
		xml : {
			parseText : function(text) {
				var parser;
				var xmlDoc;
				if (window.DOMParser) {
					parser = new DOMParser();
					xmlDoc = parser.parseFromString(text, "text/xml");
				} else {
					xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = false;
					xmlDoc.loadXML(text);
				}
				return xmlDoc.children[0];
			},
			getChildren : function(node) {
				return getChildren(node);
			},
			findChild : function(arg) {
				return findChild(arg.node, arg.name);
			},
			findChildren : function(arg) {
				return findChildren(arg.node, arg.name);
			},
			getName : function(node) {
				return node.nodeName;
			},
			getValue : function(node) {
				return node.nodeValue;
			},
			getAttribute : function(arg) {
				return arg.node.getAttribute(arg.name);
			}
		},
	};

	var resume;

	function ExprEngine(actions) {

		function evalFormula(formula, context, output) {

			var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(#)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
			var token = scanner.exec(formula);
			var result;
			var level = 0;
			function parseFormula() {
				if (parseSubexp()) {
					if (parseSize()) {
					}
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else if (parseString()) {
					return true;
				} else if (parseNumber()) {
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else if (parseObject()) {
					return true;
				} else if (parseVar()) {
					while (parseApply() || parseIndex() || parseDot()) {
					}
					if (parseSize()) {
					}
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else {
					return false;
				}
			}

			function parseSubexp() {
				if (token !== null && token[0] === "(") {
					level++;
					token = scanner.exec(formula);
					if (parseFormula()) {
						if (token === null || token[0] !== ")") {
							throw "Fail";
						}
						token = scanner.exec(formula);
					} else {
						throw "Fail";
					}
					level--;
					return true;
				} else {
					return false;
				}
			}

			function parseObject() {
				if (token !== null && token[0] === "{") {
					var obj = { };
					var prop;
					level++;
					token = scanner.exec(formula);
					if (parseProp()) {
						if (token === null || token[0] !== ":") {
							throw "Fail";
						}
						prop = result;
						token = scanner.exec(formula);
						if (token !== null && (token[0] === "," || token[0] === "}")) {
							obj[prop] = null;
						} else if (parseFormula()) {
							obj[prop] = result;
						} else {
							throw "Fail";
						}
						while (token !== null && token[0] === ",") {
							token = scanner.exec(formula);
							if (parseProp()) {
								if (token === null || token[0] !== ":") {
									throw "Fail";
								}
								prop = result;
								token = scanner.exec(formula);
								if (token !== null && (token[0] === "," || token[0] === "}")) {
									obj[prop] = null;
								} else if (parseFormula()) {
									obj[prop] = result;
								} else {
									throw "Fail";
								}
							} else {
								throw "Fail";
							}
						}
					}
					if (token === null || token[0] !== "}") {
						throw "Fail";
					}
					token = scanner.exec(formula);
					level--;
					result = obj;
					return true;
				} else {
					return false;
				}
			}

			function parseApply() {
				var prev;
				var args = [];
				if (token !== null && token[0] === "(") {
					level++;
					prev = result;
					token = scanner.exec(formula);
					if (token !== null && token[0] !== ")") {
						if (parseFormula()) {
							args[args.length] = result;
							//token = scanner.exec(formula);
							while (token !== null && token[0] === ",") {
								token = scanner.exec(formula);
								if (parseFormula()) {
									args[args.length] = result;
									//token = scanner.exec(formula);
								} else {
									throw "Fail";
								}
							}
						} else {
							throw "Fail";
						}
					}
					if (args.length == 0) {
						result = prev();
					} else if (args.length == 1) {
						result = prev(args[0]);
					} else if (args.length == 2) {
						result = prev(args[0], args[1]);
					} else if (args.length == 3) {
						result = prev(args[0], args[1], args[2]);
					} else {
						throw "Fail";
					}
					if (token === null || token[0] !== ")") {
						throw "Fail";
					}
					token = scanner.exec(formula);
					level--;
					return true;
				} else {
					return false;
				}
			}

			function parseSize() {
				var prev;
				var args = [];
				if (token !== null && token[0] === "#") {
					prev = result;
					result = prev.length;
					token = scanner.exec(formula);
					return true;
				} else {
					return false;
				}
			}

			function parseIndex() {
				var prev;
				var args = [];
				if (token !== null && token[0] === "[") {
					level++;
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev[result];
					} else {
						throw "Fail";
					}
					if (token === null || token[0] !== "]") {
						throw "Fail";
					}
					token = scanner.exec(formula);
					level--;
					return true;
				} else {
					return false;
				}
			}

			function parseDot() {
				var prev;
				if (token !== null && token[0] === ".") {
					prev = result;
					token = scanner.exec(formula);
					if (parseProp()) {
						if (prev.hasOwnProperty(result)) {
							result = prev[result];
						} else {
							throw "Fail";
						}
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parsePlus() {
				var prev;
				if (token !== null && token[0] === "+") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result += prev;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseMinus() {
				var prev;
				if (token !== null && token[0] === "-") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev - result;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseMult() {
				var prev;
				if (token !== null && token[0] === "*") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result *= prev;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseDiv() {
				var prev;
				if (token !== null && token[0] === "/") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev / result;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseLess() {
				var prev;
				if (token !== null && token[0] === "<") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev < result;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseMore() {
				var prev;
				if (token !== null && token[0] === ">") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev > result;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseEqual() {
				var prev;
				if (token !== null && token[0] === "=") {
					prev = result;
					token = scanner.exec(formula);
					if (parseFormula()) {
						result = prev === result;
					} else {
						throw "Fail";
					}
					return true;
				} else {
					return false;
				}
			}

			function parseProp() {
				if (token !== null && token[0] === token[3]) {
					result = token[0];
					token = scanner.exec(formula);
					return true;
				} else {
					return false;
				}
			}

			function parseVar() {
				if (token !== null && token[0] === token[3]) {
					result = context[token[0]];
					token = scanner.exec(formula);
					return true;
				} else {
					return false;
				}
			}

			function parseNumber() {
				if (token !== null && (token[0] === token[1] || token[0] === token[2])) {
					result = Number(token[0]);
					token = scanner.exec(formula);
					return true;
				} else {
					return false;
				}
			}

			function parseString() {
				if (token !== null && (token[0] === token[4] || token[0] === token[5])) {
					result = token[0].substr(1, token[0].length - 2);
					token = scanner.exec(formula);
					return true;
				} else {
					return false;
				}
			}

			try {
				if (parseFormula()) {
					if (result === true || result === false) {//Bonza has no booleans
						return result;
					}
					output.result = result;
					return true;
				} else {
					return false;
				}
			} catch(error) {
				return false;
			}
		};

		function evalExpr(expr, context, output) {
			var stmt;
			var where;
			var i;
			var result = { };
			var context2 = { };
			var output2 = { };
			var prop;
			var array = [];
			var array2 = [];
			var parser;
			var xmlDoc;
			var temp;
			var action;
			var item;
			var idxname;
			var arg;
			var argname;
			var ret;
			var frmpat = /\[%(.*?)%\]/g;

			var frmval = function(match, p1) {
				if (evalFormula(p1, context, output)) {
					return output.result;
				}
			};

			try {
				if (expr.nodeType == 3) {
					return evalFormula(expr.nodeValue.trim(), context, output);
				}
				switch(expr.nodeName) {
				case "invalid":
					output.result = undefined;
					return false;
				case "text":
					temp = expr.innerHTML;
					output.result = temp.replace(frmpat, frmval);
					break;
				case "eval":
					if (evalExpr(firstExpr(expr), context, result)) {
						if (window.DOMParser) {
							parser = new DOMParser();
							xmlDoc = parser.parseFromString(result.result, "text/xml");
						} else {
							xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
							xmlDoc.async = false;
							xmlDoc.loadXML(result.result);
						}
						return evalExpr(xmlDoc.children[0], context, output);
					} else {
						output.result = undefined;
						return false;
					}
					break;
				case "list":
					temp = getChildren(expr);
					array.length = temp.length;
					for ( i = 0; i < array.length; i++) {
						if (evalExpr(temp[i], context, result)) {
							array[i] = result.result;
						} else {
							output.result = undefined;
							return false;
						}
					}
					output.result = array;
					break;
				case "array":
					temp = firstExpr(findChild(expr, "size"));
					if (evalExpr(temp, context, result)) {
						array.length = result.result;
						item = findChild(expr, "item");
						idxname = item.getAttribute("index");
						for (prop in context) {
							context2[prop] = context[prop];
						}
						for ( i = 0; i < array.length; i++) {
							context2[idxname] = i;
							if (evalExpr(firstExpr(item), context2, result)) {
								array[i] = result.result;
							} else {
								output.result = undefined;
								return false;
							}
						}
					} else {
						output.result = undefined;
						return false;
					}
					output.result = array;
					break;
				case "no":
					output.result = [];
					break;
				case "calc":
					where = getChildren(expr);
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = where.length - 1; i > 0; i--) {
						stmt = where[i].children[0];
						if (evalStmt(stmt, context2, result)) {
							for (prop in result) {
								context2[prop] = result[prop];
							}
						} else {
							output.result = undefined;
							return false;
						}
					}
					return evalExpr(where[0], context2, output);
				case "func":
					arg = findChild(expr, "arg");
					argname = arg.getAttribute("name");
					ret = findChild(expr, "return");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					output.result = function(x) {
						var funcout = {};
						context2[argname] = x;
						if (evalExpr(ret, context2, funcout)) {
							return funcout.result;
						} else {
							throw "Fail";
						}
					};
					break;
				case "wrap":
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = 0; i < stmt.childNodes.length; i++) {
						if (stmt.childNodes[i].nodeType != 3) {
							if (evalStmt(stmt.childNodes[i], context2, result)) {
								for (prop in result) {
									context2[prop] = result[prop];
									output2[prop] = result[prop];
								}
								result = { };
							} else {
								return false;
							}
						}
					}
					output.result = output2;
					break;
				case "find":
					temp = firstExpr(findChild(expr, "in"));
					if (evalExpr(temp, context, output)) {
						array = output.result;
						temp = findChild(expr, "item");
						argname = temp.getAttribute("name");
						for (prop in context) {
							context2[prop] = context[prop];
						}
						for ( i = 0; i < array.length; i++) {
							context2[argname] = array[i];
							if (evalStmt(temp.children[0], context2, output2)) {
								output.result = array[i];
								return true;
							}
						}
						return false;
					}
					return false;
				case "select":
					temp = firstExpr(findChild(expr, "in"));
					if (evalExpr(temp, context, output)) {
						array = output.result;
						temp = findChild(expr, "item");
						argname = temp.getAttribute("name");
						for (prop in context) {
							context2[prop] = context[prop];
						}
						for ( i = 0; i < array.length; i++) {
							context2[argname] = array[i];
							if (evalStmt(temp.children[0], context2, output2)) {
								array2.push(array[i]);
							}
						}
						output.result = array2;
						return true;
					}
					return false;
				case "count":
					temp = firstExpr(findChild(expr, "in"));
					if (evalExpr(temp, context, output)) {
						array = output.result;
						temp = findChild(expr, "item");
						argname = temp.getAttribute("name");
						for (prop in context) {
							context2[prop] = context[prop];
						}
						var count = 0;
						for ( i = 0; i < array.length; i++) {
							context2[argname] = array[i];
							if (evalStmt(temp.children[0], context2, output2)) {
								count++;
							}
						}
						output.result = count;
						return true;
					}
					return false;
				case "redraw":
					output.result = actions.redraw();
					break;
				case "delay":
					temp = getChildren(expr);
					if (evalExpr(temp[0], context, result)) {
						action = result.result;
						if (evalExpr(firstExpr(temp[1]), context, result)) {
							output.result = actions.delay(action, result.result);
						} else {
							return false;
						}
					} else {
						return false;
					}
					break;
				case "input":
					if (evalExpr(firstExpr(expr), context, result)) {
						output.result = actions.input(result.result);
					} else {
						return false;
					}
					break;
				case "output":
					if (evalExpr(firstExpr(expr), context, result)) {
						output.result = actions.output(result.result);
					} else {
						return false;
					}
					break;
				default:
					return false;
				}
				return true;
			} catch(error) {
				return false;
			}
		};

		function evalStmt(stmt, context, output) {
			var name;
			var i;
			var prop;
			var context2 = { };
			var stmt2;
			var result = { };
			try {
				switch(stmt.nodeName) {
				case "is":
					return evalExpr(firstExpr(stmt), context, result);
				case "not":
					return !evalStmt(stmt.children[0], context, result);
				case "def":
					name = stmt.getAttribute("var");
					if (evalExpr(firstExpr(stmt), context, result)) {
						output[name] = result.result;
					} else {
						return false;
					}
					break;
				case "all":
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = 0; i < stmt.children.length; i++) {
						if (evalStmt(stmt.children[i], context2, result)) {
							for (prop in result) {
								context2[prop] = result[prop];
								output[prop] = result[prop];
							}
							result = { };
						} else {
							output = { };
							return false;
						}
					}
					break;
				case "any":
					for ( i = 0; i < stmt.children.length; i++) {
						if (evalStmt(stmt.children[i], context, result)) {
							for (prop in result) {
								output[prop] = result[prop];
							}
							return true;
						}
					}
					return false;
				case "unwrap":
					if (evalExpr(firstExpr(stmt), context, result)) {
						for (prop in result.result) {
							output[prop] = result.result[prop];
						}
					}
					break;
				default:
					return false;
				}
				return true;
			} catch(error) {
				return false;
			}
		};

		this.evalExpr = evalExpr;
		this.evalStmt = evalStmt;
	}

	/*
	 * Analyzer support
	 */

	function analyzeApplet(code, context) {
		var result = {
			errors : []
		};
		var type;
		var temp;
		var temp2;
		var temp3;
		var expr;
		var prop;
		var local = {
			vars : context.vars.slice(),
			types : context.types.slice()
		};

		try {
			result.name = code.getAttribute("name");
		} catch(error) {
			result.errors.push("Applet name not specified");
			result.noname = null;
		}
		temp = findChildren(code, "output");
		if (temp.length > 1) {
			result.errors.push("More than one output type");
			type = {
				none : null,
				errors : []
			};
		} else if (temp.length == 1) {
			type = analyzeType(temp[0].children[0], context);
		} else {
			type = {
				none : null,
				errors : []
			};
		}
		result.output = type;

		temp = findChildren(code, "state");
		if (temp.length > 1) {
			result.errors.push("More than one state specified");
			result.nostate = null;
		} else if (temp.length == 0) {
			result.errors.push("State not specified");
			result.nostate = null;
		} else {
			try {
				result.state = analyzeType(temp[0].children[0], context);
				try {
					result.statename = temp[0].getAttribute("name");
					local.vars.push({
						name : result.statename,
						type : result.state
					});
				} catch(error) {
					result.nostatename = null;
				}
			} catch(error) {
				result.errors.push("Invalid state definition");
				result.nostate = null;
			}
		}

		/*		 temp = findChildren(code, "content");
		 if (temp.length > 1) {
		 result.errors.push("More than one content specified");
		 result.nocontent = null;
		 } else if (temp.length == 0) {
		 result.errors.push("Content not specified");
		 result.nocontent = null;
		 } else {
		 try {
		 result.content = analyzeExpr(temp[0].children[0]);
		 } catch(error) {
		 result.errors.push("Invalid or missing content");
		 result.nocontent = null;
		 }
		 }

		 temp = findChildren(code, "init");
		 if (temp.length > 1) {
		 result.errors.push("More than one initialization specified");
		 result.noinit = null;
		 } else if (temp.length == 0) {
		 result.errors.push("Initialization not specified");
		 result.noinit = null;
		 } else {
		 result.init = {};
		 }

		 try {
		 local.vars.push({
		 name : temp[0].getAttribute("id"),
		 type : {
		 string : null
		 }
		 });
		 } catch(error) {
		 }

		 try {
		 local.vars.push({
		 name : temp[0].getAttribute("content"),
		 type : {
		 string : null
		 }
		 });
		 } catch(error) {
		 }

		 temp2 = findChildren(temp[0], "state");
		 if (temp2.length > 1) {
		 result.errors.push("More than one initial state specified");
		 result.init.nostate = null;
		 } else if (temp2.length == 0) {
		 result.errors.push("Initial state not specified");
		 result.init.nostate = null;
		 } else {
		 result.init.state = analyzeExpr(temp2[0], local);
		 }

		 if (result.nostate || !covariant(result.init.state, result.state)) {
		 result.errors.push("Initial state does not meet state type");
		 }

		 temp2 = findChildren(temp[0], "actions");
		 if (temp2.length > 1) {
		 result.errors.push("More than one initial action list specified");
		 result.init.noactions = null;
		 } else if (temp2.length == 0) {
		 result.errors.push("Initial actions not specified");
		 result.init.noactions = null;
		 } else {
		 result.init.actions = analyzeExpr(temp2[0], local);
		 if (!covariant(result.init.actions, {
		 array : {
		 action : null
		 }
		 })) {
		 result.errors.push("Initial actions must be an array of actions");
		 }
		 }

		 temp = findChildren(code, "respond");
		 if (temp.length > 1) {
		 result.errors.push("More than one response specified");
		 result.noinit = null;
		 } else if (temp.length == 0) {
		 result.errors.push("Response not specified");
		 result.noinit = null;
		 } else {
		 try {
		 temp2 = findChildren(temp[0], "input");
		 } catch(error) {
		 temp2 = [];
		 }
		 if (temp2.length > 1) {
		 result.errors.push("More than one input specified");
		 result.noinput = null;
		 } else if (temp2.length == 0) {
		 result.errors.push("Response input not specified");
		 result.noinput = null;
		 } else {
		 result.input = analyzeType(temp2[0]);
		 }
		 local.vars.push({
		 name : temp[0].getAttribute("content"),
		 type : {
		 string : null
		 }
		 });
		 }
		 */
		return result;

	}

	function analyzeFormula(formula, context, output) {

		var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(#)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
		var token = scanner.exec(formula);
		var result = {
			none : null
		};
		var level = 0;
		function parseFormula() {
			if (token === null) {
				return result;
			} else {

				if (parseSubexp()) {
					if (parseSize()) {
					}
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else if (parseString()) {
					return true;
				} else if (parseNumber()) {
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else if (parseObject()) {
					return true;
				} else if (parseVar()) {
					while (parseApply() || parseIndex() || parseDot()) {
					}
					if (parseSize()) {
					}
					if (parseMult() || parseDiv()) {
					}
					if (parsePlus() || parseMinus()) {
					}
					if (parseEqual() || parseLess() || parseMore()) {
					}
					return true;
				} else {
					return false;
				}
			}
		}

		function parseSubexp() {
			if (token !== null && token[0] === "(") {
				level++;
				token = scanner.exec(formula);
				if (parseFormula()) {
					if (token === null || token[0] !== ")") {
						throw "Fail";
					}
					token = scanner.exec(formula);
				} else {
					throw "Fail";
				}
				level--;
				return true;
			} else {
				return false;
			}
		}

		function parseObject() {
			if (token !== null && token[0] === "{") {
				var obj = { };
				var prop;
				level++;
				token = scanner.exec(formula);
				if (parseProp()) {
					if (token === null || token[0] !== ":") {
						throw "Fail";
					}
					prop = result;
					token = scanner.exec(formula);
					if (token !== null && (token[0] === "," || token[0] === "}")) {
						obj[prop] = null;
					} else if (parseFormula()) {
						obj[prop] = result;
					} else {
						throw "Fail";
					}
					while (token !== null && token[0] === ",") {
						token = scanner.exec(formula);
						if (parseProp()) {
							if (token === null || token[0] !== ":") {
								throw "Fail";
							}
							prop = result;
							token = scanner.exec(formula);
							if (token !== null && (token[0] === "," || token[0] === "}")) {
								obj[prop] = null;
							} else if (parseFormula()) {
								obj[prop] = result;
							} else {
								throw "Fail";
							}
						} else {
							throw "Fail";
						}
					}
				}
				if (token === null || token[0] !== "}") {
					throw "Fail";
				}
				token = scanner.exec(formula);
				level--;
				result = obj;
				return true;
			} else {
				return false;
			}
		}

		function parseApply() {
			var prev;
			var args = [];
			if (token !== null && token[0] === "(") {
				level++;
				prev = result;
				token = scanner.exec(formula);
				if (token !== null && token[0] !== ")") {
					if (parseFormula()) {
						args[args.length] = result;
						//token = scanner.exec(formula);
						while (token !== null && token[0] === ",") {
							token = scanner.exec(formula);
							if (parseFormula()) {
								args[args.length] = result;
								//token = scanner.exec(formula);
							} else {
								throw "Fail";
							}
						}
					} else {
						throw "Fail";
					}
				}
				if (args.length == 0) {
					result = prev();
				} else if (args.length == 1) {
					result = prev(args[0]);
				} else if (args.length == 2) {
					result = prev(args[0], args[1]);
				} else if (args.length == 3) {
					result = prev(args[0], args[1], args[2]);
				} else {
					throw "Fail";
				}
				if (token === null || token[0] !== ")") {
					throw "Fail";
				}
				token = scanner.exec(formula);
				level--;
				return true;
			} else {
				return false;
			}
		}

		function parseSize() {
			var prev;
			var args = [];
			if (token !== null && token[0] === "#") {
				prev = result;
				result = prev.length;
				token = scanner.exec(formula);
				return true;
			} else {
				return false;
			}
		}

		function parseIndex() {
			var prev;
			var args = [];
			if (token !== null && token[0] === "[") {
				level++;
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev[result];
				} else {
					throw "Fail";
				}
				if (token === null || token[0] !== "]") {
					throw "Fail";
				}
				token = scanner.exec(formula);
				level--;
				return true;
			} else {
				return false;
			}
		}

		function parseDot() {
			var prev;
			if (token !== null && token[0] === ".") {
				prev = result;
				token = scanner.exec(formula);
				if (parseProp()) {
					if (prev.hasOwnProperty(result)) {
						result = prev[result];
					} else {
						throw "Fail";
					}
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parsePlus() {
			var prev;
			if (token !== null && token[0] === "+") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result += prev;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseMinus() {
			var prev;
			if (token !== null && token[0] === "-") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev - result;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseMult() {
			var prev;
			if (token !== null && token[0] === "*") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result *= prev;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseDiv() {
			var prev;
			if (token !== null && token[0] === "/") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev / result;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseLess() {
			var prev;
			if (token !== null && token[0] === "<") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev < result;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseMore() {
			var prev;
			if (token !== null && token[0] === ">") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev > result;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseEqual() {
			var prev;
			if (token !== null && token[0] === "=") {
				prev = result;
				token = scanner.exec(formula);
				if (parseFormula()) {
					result = prev === result;
				} else {
					throw "Fail";
				}
				return true;
			} else {
				return false;
			}
		}

		function parseProp() {
			if (token !== null && token[0] === token[3]) {
				result = token[0];
				token = scanner.exec(formula);
				return true;
			} else {
				return false;
			}
		}

		function parseVar() {
			if (token !== null && token[0] === token[3]) {
				result = context[token[0]];
				token = scanner.exec(formula);
				return true;
			} else {
				return false;
			}
		}

		function parseNumber() {
			if (token !== null && (token[0] === token[1] || token[0] === token[2])) {
				result = Number(token[0]);
				token = scanner.exec(formula);
				return true;
			} else {
				return false;
			}
		}

		function parseString() {
			if (token !== null && (token[0] === token[4] || token[0] === token[5])) {
				result = token[0].substr(1, token[0].length - 2);
				token = scanner.exec(formula);
				return true;
			} else {
				return false;
			}
		}

		try {
			return {
				type : parseFormula(),
				errors : []
			};
		} catch(error) {
			return {
				type : {
					none : null
				},
				errors : [error]
			};
		}

	};

	function analyzeExpr(expr, context) {
		var stmt;
		var where;
		var i;
		var result = { };
		var context2 = { };
		var output2 = { };
		var prop;
		var array = [];
		var array2 = [];
		var parser;
		var xmlDoc;
		var temp;
		var action;
		var item;
		var idxname;
		var arg;
		var argname;
		var ret;
		var frmpat = /\[%(.*?)%\]/g;

		var frmval = function(match, p1) {
			if (analyzeFormula(p1, context)) {
				return output.result;
			}
		};

		try {
			if (expr.nodeType == 3) {
				return analyzeFormula(expr.nodeValue.trim(), context);
			}
			switch(expr.nodeName) {
			case "invalid":
				output.result = undefined;
				return false;
			case "text":
				temp = expr.innerHTML;
				output.result = temp.replace(frmpat, frmval);
				break;
			case "eval":
				if (evalExpr(firstExpr(expr), context, result)) {
					if (window.DOMParser) {
						parser = new DOMParser();
						xmlDoc = parser.parseFromString(result.result, "text/xml");
					} else {
						xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
						xmlDoc.async = false;
						xmlDoc.loadXML(result.result);
					}
					return evalExpr(xmlDoc.children[0], context, output);
				} else {
					output.result = undefined;
					return false;
				}
				break;
			case "list":
				temp = getChildren(expr);
				array.length = temp.length;
				for ( i = 0; i < array.length; i++) {
					if (evalExpr(temp[i], context, result)) {
						array[i] = result.result;
					} else {
						output.result = undefined;
						return false;
					}
				}
				output.result = array;
				break;
			case "array":
				temp = firstExpr(findChild(expr, "size"));
				if (evalExpr(temp, context, result)) {
					array.length = result.result;
					item = findChild(expr, "item");
					idxname = item.getAttribute("index");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = 0; i < array.length; i++) {
						context2[idxname] = i;
						if (evalExpr(firstExpr(item), context2, result)) {
							array[i] = result.result;
						} else {
							output.result = undefined;
							return false;
						}
					}
				} else {
					output.result = undefined;
					return false;
				}
				output.result = array;
				break;
			case "no":
				output.result = [];
				break;
			case "calc":
				where = getChildren(expr);
				for (prop in context) {
					context2[prop] = context[prop];
				}
				for ( i = where.length - 1; i > 0; i--) {
					stmt = where[i].children[0];
					if (evalStmt(stmt, context2, result)) {
						for (prop in result) {
							context2[prop] = result[prop];
						}
					} else {
						output.result = undefined;
						return false;
					}
				}
				return evalExpr(where[0], context2, output);
			case "func":
				arg = findChild(expr, "arg");
				argname = arg.getAttribute("name");
				ret = findChild(expr, "return");
				for (prop in context) {
					context2[prop] = context[prop];
				}
				output.result = function(x) {
					var funcout = {};
					context2[argname] = x;
					if (evalExpr(ret, context2, funcout)) {
						return funcout.result;
					} else {
						throw "Fail";
					}
				};
				break;
			case "wrap":
				for (prop in context) {
					context2[prop] = context[prop];
				}
				for ( i = 0; i < stmt.childNodes.length; i++) {
					if (stmt.childNodes[i].nodeType != 3) {
						if (evalStmt(stmt.childNodes[i], context2, result)) {
							for (prop in result) {
								context2[prop] = result[prop];
								output2[prop] = result[prop];
							}
							result = { };
						} else {
							return false;
						}
					}
				}
				output.result = output2;
				break;
			case "find":
				temp = firstExpr(findChild(expr, "in"));
				if (evalExpr(temp, context, output)) {
					array = output.result;
					temp = findChild(expr, "item");
					argname = temp.getAttribute("name");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = 0; i < array.length; i++) {
						context2[argname] = array[i];
						if (evalStmt(temp.children[0], context2, output2)) {
							output.result = array[i];
							return true;
						}
					}
					return false;
				}
				return false;
			case "select":
				temp = firstExpr(findChild(expr, "in"));
				if (evalExpr(temp, context, output)) {
					array = output.result;
					temp = findChild(expr, "item");
					argname = temp.getAttribute("name");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = 0; i < array.length; i++) {
						context2[argname] = array[i];
						if (evalStmt(temp.children[0], context2, output2)) {
							array2.push(array[i]);
						}
					}
					output.result = array2;
					return true;
				}
				return false;
			case "count":
				temp = firstExpr(findChild(expr, "in"));
				if (evalExpr(temp, context, output)) {
					array = output.result;
					temp = findChild(expr, "item");
					argname = temp.getAttribute("name");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					var count = 0;
					for ( i = 0; i < array.length; i++) {
						context2[argname] = array[i];
						if (evalStmt(temp.children[0], context2, output2)) {
							count++;
						}
					}
					output.result = count;
					return true;
				}
				return false;
			case "redraw":
				output.result = actions.redraw();
				break;
			case "delay":
				temp = getChildren(expr);
				if (evalExpr(temp[0], context, result)) {
					action = result.result;
					if (evalExpr(firstExpr(temp[1]), context, result)) {
						output.result = actions.delay(action, result.result);
					} else {
						return false;
					}
				} else {
					return false;
				}
				break;
			case "input":
				if (evalExpr(firstExpr(expr), context, result)) {
					output.result = actions.input(result.result);
				} else {
					return false;
				}
				break;
			case "output":
				if (evalExpr(firstExpr(expr), context, result)) {
					output.result = actions.output(result.result);
				} else {
					return false;
				}
				break;
			default:
				return false;
			}
			return true;
		} catch(error) {
			return false;
		}
	};

	function analyzeStmt(stmt, context) {
		var result = {
			vars : [],
			errors : []
		};
		var expr;
		var children;
		var name;
		var i;
		var j;
		var context2 = {};
		var prop;
		var vars = {};

		switch(stmt.nodeName) {
		case "is":
			children = getChildren(stmt);
			if (children.length == 0) {
				result.errors.push("Missing expression");
			} else if (children.length > 1) {
				result.errors.push("More than one expression specified");
			} else {
				expr = analyzeExpr(firstExpr(stmt), context);
				if (expr.errors.length != 0) {
					result.errors.push("Invalid expression");
				}
				result.is = expr;
			}
			break;
		case "not":
			children = getChildren(stmt);
			if (children.length == 0) {
				result.errors.push("Missing statement");
			} else if (children.length > 1) {
				result.errors.push("More than one statement specified");
			} else {
				expr = analyzeStmt(stmt.children[0], context);
				if (expr.errors.length != 0) {
					result.errors.push("Invalid statement");
				}
				result.not = expr;
			}
			break;
		case "def":
			try {
				name = code.getAttribute("var");
				result.vars.push({
					name : name
				});
				children = getChildren(stmt);
				if (children.length == 0) {
					result.errors.push("Missing expression");
				} else if (children.length > 1) {
					result.errors.push("More than one expression specified");
				} else {
					expr = analyzeExpr(firstExpr(stmt), context);
					if (expr.errors.length != 0) {
						result.errors.push("Invalid expression");
					}
					result.vars[0].type = expr.type;
					result.def = expr;
				}
			} catch(error) {
				result.errors.push("Missing variable");
			}
			break;
		case "all":
			children = getChildren(stmt);
			for ( j = 0; j < context.types.length; j++) {
				context2.types.push(context.types[j]);
			}
			for ( j = 0; j < context.vars.length; j++) {
				vars[context.vars[j].name] = context.vars[j].type;
				context2.vars.push(context.vars[j]);
			}
			result.all = [];
			for ( i = 0; i < children.length; i++) {
				expr = analyzeStmt(children[i], context2);
				for ( j = 0; j < expr.vars.length; j++) {
					if (vars.hasOwnProperty(expr.vars[j].name)) {
						result.errors.push("Variable redefined: " + expr.vars[j].name);
					} else {
						vars[expr.vars[j].name] = expr.vars[j].type;
						context2.vars.push(context.vars[j]);
					}
				}
				result.all.push(expr);
			}
			result.vars = context2.vars;
			break;
		case "any":
			children = getChildren(stmt);
			for ( j = 0; j < context.types.length; j++) {
				context2.types.push(context.types[j]);
			}
			for ( j = 0; j < context.vars.length; j++) {
				vars[context.vars[j].name] = context.vars[j].type;
				context2.vars.push(context.vars[j]);
			}
			result.any = [];
			if (children.length > 0) {
				expr = analyzeStmt(children[0], context2);
				for ( j = 0; j < expr.vars.length; j++) {
					vars[expr.vars[j].name] = {
						type : expr.vars[j].type,
						count : 0
					};
				}
				for ( i = 1; i < children.length; i++) {
					expr = analyzeStmt(children[i], context2);
					for ( j = 0; j < expr.vars.length; j++) {
						vars[expr.vars[j].name].count++;
						if (vars.hasOwnProperty(expr.vars[j].name)) {
							if (isObjType(expr.vars[j].type)) {
								vars[expr.vars[j].name] = combine(expr.vars[j].type, vars[expr.vars[j].name]);
							} else {
								result.errors.push("Incompatible types for " + expr.vars[j].name);
							}
						}
					}
					result.any.push(expr);
				}
				for (prop in vars) {
					if (vars[prop].count == children.length) {
						result.vars.push({
							name : prop,
							type : vars[prop].type
						});
					}
				}
			}
			break;
		case "unwrap":
			break;
		default:
			result.errors.push("Unknown statement: " + stmt.nodeName);
			result.other = null;
			break;
		}

		return result;
	}

	function isObjType(type) {
		return type.hasOwnProperty("prop") || type.hasOwnProperty("all") || type.hasOwnProperty("any");
	}

	function combine(type1, type2) {
		var result = {
			errors : []
		};
		if (type1.hasOwnProperty("prop")) {

			if (type2.hasOwnProperty("prop")) {
				if (type1.prop.name == type2.prop.name) {
					if (covariant(type1.prop.type, type2.prop.type) && covariant(type2.prop.type, type1.prop.type)) {
						result.prop = type1.prop;
					} else {
						result.none = null;
						result.errors.push("Incompatible property types");
					}
				} else {
					result.any = [type1, type2];
				}
			} else {
				result.errors.push("Only single-property types can be combined into variants");
			}
		} else {
			result.errors.push("Only single-property types can be combined into variants");
		}
	}

	function analyzeType(code, context) {
		var type;
		var errors = 0;
		var name;
		var temp;
		var i;
		var chidren = [];
		var argerrors = [];
		var reterrors = [];
		var argtype;
		var rettype;
		var prop;
		var result = {
			errors : []
		};

		switch(code.nodeName) {
		case "none":
			return {
				none : null,
				errors : []
			};
		case "integer":
			return {
				integer : null,
				errors : []
			};
		case "number":
			return {
				number : null,
				errors : []
			};
		case "string":
			return {
				string : null,
				errors : []
			};
		case "time":
			return {
				time : null,
				errors : []
			};
		case "interval":
			return {
				interval : null,
				errors : []
			};
		case "dynamic":
			return {
				dynamic : null,
				errors : []
			};
		case "action":
			return {
				action : null,
				errors : []
			};
		case "prop":
			try {
				name = code.getAttribute("name");
			} catch(error) {
				return {
					none : null,
					errors : ["Missing property name"]
				};
			}
			if (code.children.length == 0) {
				type = {
					none : null,
					errors : []
				};
			} else {
				type = analyzeType(code.children[0], context);
			}
			if (type.errors.length == 0) {
				return {
					prop : {
						name : name,
						type : type
					},
					errors : []
				};
			} else {
				return {
					prop : {
						name : name,
						type : type
					},
					errors : ["Invalid object property type"]
				};
			}
		case "all":
			chidren.length = code.children.length;
			for ( i = 0; i < code.children.length; i++) {
				type = analyzeType(code.children[i], context);
				if (!isObjType(type)) {
					errors++;
				}
				chidren[i] = type;
				if (type.errors.length != 0) {
					errors++;
				}
			}
			if (errors == 0) {
				return {
					all : chidren,
					errors : []
				};
			} else {
				return {
					all : chidren,
					errors : ["Invalid object property type"]
				};
			}
		case "any":
			chidren.length = code.children.length;
			for ( i = 0; i < code.children.length; i++) {
				type = analyzeType(code.children[i], context);
				if (!isObjType(type)) {
					errors++;
				}
				chidren[i] = type;
				if (type.errors.length != 0) {
					errors++;
				}
			}
			if (errors == 0) {
				return {
					any : chidren,
					errors : []
				};
			} else {
				return {
					any : chidren,
					errors : ["Invalid object property type"]
				};
			}
		case "array":
			try {
				type = analyzeType(code.children[0], context);
			} catch(error) {
				return {
					none : null,
					errors : ["Missing array element type"]
				};
			}
			if (type.errors.length == 0) {
				return {
					array : type,
					errors : []
				};
			} else {
				return {
					array : type,
					errors : ["Invalid array element type"]
				};
			}
		case "func":
			children = findChildren(code, "arg");
			if (chidren.length > 1 || (chidren.length == 1 && children[0].children.length > 1)) {
				argerrors = ["More than one argument type"];
				argtype = {
					none : null,
					errors : []
				};
			} else if (chidren.length == 0 || (chidren.length == 1 && children[0].children.length == 0)) {
				argerrors = ["Missing argument type"];
				argtype = {
					none : null,
					errors : []
				};
			} else {
				argtype = analyzeType(chidren[0].children[0], context);
			}
			children = findChildren(code, "return");
			if (chidren.length > 1 || (chidren.length == 1 && children[0].children.length > 1)) {
				reterrors = ["More than one return type"];
				rettype = {
					none : null,
					errors : []
				};
			} else if (chidren.length == 0 || (chidren.length == 1 && children[0].children.length == 0)) {
				reterrors = ["Missing return type"];
				rettype = {
					none : null,
					errors : []
				};
			} else {
				rettype = analyzeType(chidren[0].children[0], context);
			}
			temp = [];
			if (argerrors.length > 0) {
				temp.push(argerrors[0]);
			}
			if (reterrors.length > 0) {
				temp.push(reterrors[0]);
			}
			return {
				func : {
					arg : argtype,
					ret : rettype,
					errors : temp
				}
			};
		case "type":
			try {
				name = code.getAttribute("name");
			} catch(error) {
				return {
					none : null,
					errors : ["Missing type name"]
				};
			}
			for ( i = 0; i < context.types.length; i++) {
				if (context.types[i].name == name) {
					return context.types[i].type;
				}
			}
			return {
				none : null,
				errors : ["Unknown user-defined data type: " + name]
			};
		default:
			return {
				none : null,
				errors : ["Unknown data type: " + code.nodeName]
			};
		}
	}

	function typeStr(type) {
		var temp;
		var i;

		if (type.hasOwnProperty("none")) {
			return "none";
		} else if (type.hasOwnProperty("integer")) {
			return "integer";
		} else if (type.hasOwnProperty("number")) {
			return "number";
		} else if (type.hasOwnProperty("string")) {
			return "string";
		} else if (type.hasOwnProperty("time")) {
			return "time";
		} else if (type.hasOwnProperty("interval")) {
			return "interval";
		} else if (type.hasOwnProperty("dynamic")) {
			return "dynamic";
		} else if (type.hasOwnProperty("action")) {
			return "action";
		} else if (type.hasOwnProperty("array")) {
			return "[" + typeStr(type.array) + "]";
		} else if (type.hasOwnProperty("prop")) {
			if (type.prop.type.hasOwnProperty("none")) {
				return type.prop.name + ': ';
			} else {
				return type.prop.name + ': ' + typeStr(type.prop.type);
			}
		} else if (type.hasOwnProperty("all")) {
			temp = "{ ";
			for ( i = 0; i < type.all.length - 1; i++) {
				temp = temp.concat(typeStr(type.all[i]), ", ");
			}
			return temp + typeStr(type.all[type.all.length - 1]) + " }";
		} else if (type.hasOwnProperty("any")) {
			temp = "{ ";
			for ( i = 0; i < type.any.length - 1; i++) {
				temp = temp.concat(typeStr(type.any[i]), " | ");
			}
			return temp + typeStr(type.any[type.any.length - 1]) + " }";
		} else if (type.hasOwnProperty("func")) {
			return typeStr(type.arg) + " -> " + typeStr(type.ret);
		} else {
			return "unknown";
		}
	}

	function covFunc(type1, type2) {
		if (type1.hasOwnProperty("func") && type2.hasOwnProperty("func")) {
			return covariant(type2.func.arg, type1.func.arg) && covariant(type1.func.ret, type2.func.ret);
		} else {
			return false;
		}
	}

	function covObj(type1, type2) {
		var i;

		if (type2.hasOwnProperty("prop")) {
			if (type1.hasOwnProperty("prop")) {
				return type1.prop.name == type2.prop.name && covariant(type1.prop.type, type2.prop.type);
			} else if (type1.hasOwnProperty("all")) {
				for ( i = 0; i < type1.all.length; i++) {
					if (covariant(type1.all[i], type2)) {
						return true;
					}
				}
				return false;
			} else {
				return false;
			}
		} else if (type2.hasOwnProperty("any")) {
			for ( i = 0; i < type2.any.length; i++) {
				if (covObj(type1, type2.any[i])) {
					return true;
				}
			}
			return false;
		} else if (type2.hasOwnProperty("all")) {
			for ( i = 0; i < type2.all.length; i++) {
				if (!covObj(type1, type2.all[i])) {
					return false;
				}
			}
			return true;
		} else {
			return false;
		}
	}

	function covariant(type1, type2) {
		function both(name) {
			return type1.hasOwnProperty(name) && type2.hasOwnProperty(name);
		}

		return both("none") || both("integer") || both("number") || both("string") || both("time") || both("interval") || (both("array") && covariant(type1.array, type2.array)) || covObj(type1, type2) || covFunc(type1, type2);
	}

	function analyzeLib(code) {
		var result = {
			global : {
				vars : [],
				types : []
			},
			errors : [],
			applets : []
		};
		var type;
		var temp;
		var temp2;
		var expr;
		var stmt;
		var applet;
		var name;
		var i;
		var j;

		temp = findChildren(code, "type");
		for ( i = 0; i < temp.length; i++) {
			try {
				name = temp[i].getAttribute("name");
				temp2 = temp[i].children;
				if (temp2.length != 1) {
					result.errors.push("Invalid type definition for " + name);
				} else {
					type = analyzeType(temp2[0], result.global);
					if (type.errors.length > 0) {
						result.errors.push("Invalid type definition for " + name);
					}
					result.global.types.push({
						name : name,
						type : type
					});

				}
			} catch(error) {
				result.errors.push("Type definition has no name attribute");
			}
		}

		temp = findChildren(code, "common");
		if (temp.length > 1) {
			result.errors.push("More than one common section specified");
			result.common = [];
		} else if (temp.length == 1) {
			for ( i = 0; i < temp[0].children.length; i++) {
				stmt = analyzeStmt(temp[0].children[i], result.global);
				if (stmt.errors.length > 0) {
					result.errors.push("Common section contains errors");
					break;
				} else {
					for ( j = 0; j < stmt.vars.length; j++) {
						result.global.vars.push(stmt.vars[j]);
					}
				}
			}
		}

		temp = findChildren(code, "applet");
		for ( i = 0; i < temp.length; i++) {
			applet = analyzeApplet(temp[i], result.global);
			if (applet.errors.length > 0) {
				if (applet.hasOwnProperty("name")) {
					name = applet.name;
				} else {
					name = "unnamed";
				}
				result.errors.push("Invalid applet definition: " + name);
			}
			result.applets.push(applet);

		}

		return result;

	}

	/*
	 * Run-time objects
	 */

	function Applet(xml, context, engine) {
		var temp;
		var prop;
		this.local = {};
		var i;
		var j;

		this.name = xml.getAttribute("name");
		this.events = {};
		this.listeners = {};

		for ( i = 0; i < xml.children.length; i++) {
			temp = xml.children[i];
			switch(temp.nodeName) {
			case "state":
				this.statename = temp.getAttribute("name");
				break;
			case "content":
				this.content = firstExpr(temp);
				break;
			case "init":
				this.idname = temp.getAttribute("id");
				this.contentname = temp.getAttribute("content");
				this.initState = firstExpr(findChild(temp, "state"));
				try {
					this.initActions = firstExpr(findChild(temp, "actions"));
				} catch(error) {
				}
				break;
			case "respond":
				this.inputname = findChild(temp, "input").getAttribute("name");
				this.respState = firstExpr(findChild(temp, "state"));
				try {
					this.respActions = firstExpr(findChild(temp, "actions"));
				} catch(error) {
				}
				break;
			case "events":
				this.eventname = temp.getAttribute("data");
				for ( j = 0; j < temp.children.length; j++) {
					this.events[temp.children[j].nodeName] = firstExpr(temp.children[j]);
				}
				break;
			case "accept":
				for ( j = 0; j < temp.children.length; j++) {
					this.listeners[temp.children[j].getAttribute("applet")] = {
						data : temp.children[j].getAttribute("data"),
						expr : firstExpr(temp.children[j])
					};
				}
				break;
			case "output":
				break;
			default:
				throw "Error";
			}
		}

		this.instances = {};
		this.input = [];

		var output = {};
		for (prop in context) {
			this.local[prop] = context[prop];
		}

		var applet = this;

		this.handlers = {
			click : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.click, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			focus : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.focus, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			blur : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				applet.local[applet.eventname] = e.currentTarget.value;
				if (engine.evalExpr(applet.events.blur, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			change : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				applet.local[applet.eventname] = e.currentTarget.value;
				if (engine.evalExpr(applet.events.change, applet.local, output)) {
					//e.stopPropagation();
					//e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			mouseover : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.mouseover, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			mouseout : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.mouseout, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			mousedown : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.mousedown, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			},
			mouseup : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.mouseup, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
					applet.respond(id, output.result);
				}
			}
		};

		this.create = function(id) {
			this.local[this.idname] = id;
			var element = document.getElementById(id);
			this.local[this.contentname] = element.innerHTML;
			if (engine.evalExpr(this.initState, this.local, output)) {
				this.instances[id] = output.result;
				this.local[this.statename] = output.result;
				if (engine.evalExpr(this.content, this.local, output)) {
					element.innerHTML = output.result;
				}
				resume();
				this.input[id] = [];
				for (var e in this.events) {
					element.addEventListener(e, this.handlers[e]);
				}
				if (engine.evalExpr(this.initActions, this.local, output)) {
					var actions = output.result;
					for ( i = 0; i < actions.length; i++) {
						var action = actions[i];
						action(this, id);
					}
				}
			}
			delete this.local[this.idname];
			delete this.local[this.contentname];
		};
		this.exists = function(id) {
			return this.instances.hasOwnProperty(id);
		};
		this.redraw = function(id) {
			this.local[this.statename] = this.instances[id];
			if (engine.evalExpr(this.content, this.local, output)) {
				var element = document.getElementById(id);
				element.innerHTML = output.result;
				resume();
			}
		};
		this.respond = function(id, msg) {
			this.input[id].push(msg);
			resume();
		};
		this.run = function(id) {
			var instance = this.instances[id];
			var queue = this.input[id];
			this.local[this.statename] = instance;
			i = 0;
			while (i < queue.length) {
				this.local[this.inputname] = queue[i];
				if (engine.evalExpr(this.respState, this.local, output)) {
					this.instances[id] = output.result;
					this.local[this.statename] = output.result;
					if (engine.evalExpr(this.respActions, this.local, output)) {
						var actions = output.result;
						for ( j = 0; j < actions.length; j++) {
							var action = actions[j];
							action(this, id);
						}
					}
				}
				i++;
			}
			this.input[id] = [];
		};
		this.broadcast = function(msg) {
			var instance;
			this.local[this.inputname] = msg;
			for (var id in this.instances) {
				instance = this.instances[id];
				this.local[this.statename] = instance;
				this.input[id].push(msg);
				resume();
			}
		};
		this.destroy = function(id) {
			delete this.instances[id];
			delete this.input[id];
		};
	}

	function Library(xml) {
		this.applets = {};
		var temp;
		var name;
		var output = {};
		var prop;
		var common;
		this.context = {
			core : core
		};
		var lib = this;
		var code = {
			analyzeLib : analyzeLib,
			typeStr : typeStr
		};

		var actions = {
			redraw : function() {
				return function(applet, id) {
					applet.redraw(id);
					//resume();
				};
			},
			output : function(msg) {
				return function(applet, id) {
					for (var name in lib.applets) {
						var target = lib.applets[name];
						if (target.listeners.hasOwnProperty(applet.name)) {//target applet has a listener for current applet?
							var local = {};
							for (prop in target.local) {
								local[prop] = target.local[prop];
							}
							local[target.listeners[applet.name].data] = msg;
							for (var id in target.instances) {
								var state = target.instances[id];
								local[target.statename] = state;
								if (engine.evalExpr(target.listeners[applet.name].expr, local, output)) {
									target.respond(id, output.result);
								}
							}
						}
					}
				};
			},
			input : function(msg) {
				return function(applet, id) {
					applet.respond(id, msg);
				};
			},
			delay : function(action, interval) {
				return function(applet, id) {
					setTimeout(function() {
						action(applet, id);
					}, interval);
				};
			},
			now : function(timename, success) {
				return function(applet, id) {
					var local = {};
					for (prop in applet.local) {
						local[prop] = applet.local[prop];
					}
					local[timename] = Number(Date());
					if (engine.evalExpr(success, local, output)) {
						applet.respond(id, output.result);
					}
				};
			},
			random : function(numname, success) {
				return function(applet, id) {
					var local = {};
					for (prop in applet.local) {
						local[prop] = applet.local[prop];
					}
					local[numname] = Math.random();
					if (engine.evalExpr(success, local, output)) {
						applet.respond(id, output.result);
					}
				};
			},
			gettext : function(url, resultname, success) {
				return function(applet, id) {
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange = function() {
						if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
							var local = {};
							for (prop in applet.local) {
								local[prop] = applet.local[prop];
							}
							local[resultname] = xmlhttp.responseText;
							if (engine.evalExpr(success, local, output)) {
								applet.respond(id, output.result);
							}
						}
					};
					xmlhttp.open("GET", url, true);
					xmlhttp.send();
				};
			},
			getxml : function(url, resultname, success) {
				return function(applet, id) {
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange = function() {
						if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
							var local = {};
							for (prop in applet.local) {
								local[prop] = applet.local[prop];
							}
							local[resultname] = xmlhttp.responseXML.children[0];
							if (engine.evalExpr(success, local, output)) {
								applet.respond(id, output.result);
							}
						}
					};
					xmlhttp.open("GET", url, true);
					xmlhttp.send();
				};
			}
		};

		var engine = new ExprEngine(actions);
		var i;
		var j;

		var run = function() {
			var name;
			var applet;
			var elements;
			var element;
			var id;
			var ids;
			var i;

			this.active = false;
			for (name in lib.applets) {
				ids = [];
				applet = lib.applets[name];
				elements = document.getElementsByClassName("bonza-" + name);
				for ( i = 0; i < elements.length; i++) {
					element = elements[i];
					id = element.getAttribute("id");
					if (id !== null && id !== "") {
						if (!applet.exists(id)) {
							ids.push(id);
						}
					}
				}
				for (id in applet.instances) {
					element = document.getElementById(id);
					if (element === null) {
						applet.destroy(id);
					} else {
						applet.run(id);
					}
				}
				for (i in ids) {
					id = ids[i];
					applet.create(id);
				}
			}
		};

		temp = findChildren(xml, "common");
		if (temp.length > 0) {
			temp = temp[0];
			for ( i = 0; i < temp.children.length; i++) {
				if (!engine.evalStmt(temp.children[i], lib.context, output)) {
					throw "Fail";
				}
				for (prop in output) {
					this.context[prop] = output[prop];
				}
			}
		}

		temp = findChildren(xml, "applet");
		for ( i = 0; i < temp.length; i++) {
			name = temp[i].getAttribute("name");
			applet = new Applet(temp[i], lib.context, engine);
			this.applets[name] = applet;
		}

		code.self = xml;
		this.context.core.code = code;

		this.active = false;
		resume = function() {
			if (!this.active) {
				setTimeout(run, 0);
				this.active = true;
			}
		};
		this.run = run;
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var xml = xmlhttp.responseXML;
			var lib = new Library(xml.children[0]);
			lib.run();
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
