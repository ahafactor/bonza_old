/*
 * ===== Bonza Framework =====
 * © Aha! Factor Pty Ltd, 2015
 * ===========================
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

	function findChild(node, name) {
		var i = 0;
		var result = [];
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
					return args.str.slice(args.start, args.end);
				}
			},
			length : function(str) {
				return str.length;
			},
			join : function(arg) {
				var result = "";
				for (var i = 0; i < arg.length; i++) {
					result.concat(arg[i]);
				}
				return result;
			},
			split : function(arg) {
				return arg.str.split(arg.sep);
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
				findChild(arg.node, arg.name);
			}
		},
	};

	var resume;

	function ExprEngine(actions) {

		function evalFormula(formula, context, output) {

			var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(#)|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
			var token = scanner.exec(formula);
			var valstack = [];
			var opstack = [];
			var result;
			var more;
			var level = 0;
			function parseFormula() {
				if (parseSubexp()) {
					if(parseSize()){					
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
					if(parseSize()){					
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

		function firstExpr(node) {
			var first = 0;
			while (node.childNodes[first].nodeType == 3 && node.childNodes[first].nodeValue.trim() == "") {
				first++;
			}
			return node.childNodes[first];
		}

		function evalExpr(expr, context, output) {
			var stmt;
			var where;
			var i;
			var result = { };
			var context2 = { };
			var output2 = { };
			var prop;
			var array = [];
			var parser;
			var xmlDoc;
			var temp;
			var frmpat = /\[%(.*?)%\]/g;
			var action;
			var item;
			var idxname;

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
					temp = findChild(expr, "size");
					if (evalExpr(temp, context, result)) {
						array.length = result.result;
						item = findChild(expr, "item");
						idxname = temp.getAttribute("index");
						for (prop in context) {
							context2[prop] = context[prop];
						}
						for ( i = 0; i < array.length; i++) {
							context2[idxname] = i;
							if (evalExpr(item, context2, result)) {
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
		this.firstExpr = firstExpr;
	}

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
				this.content = engine.firstExpr(temp);
				break;
			case "init":
				this.idname = temp.getAttribute("id");
				this.contentname = temp.getAttribute("content");
				this.initState = engine.firstExpr(findChild(temp, "state"));
				try {
					this.initActions = engine.firstExpr(findChild(temp, "actions"));
				} catch(error) {}
				break;
			case "respond":
				this.inputname = findChild(temp, "input").getAttribute("name");
				this.respState = engine.firstExpr(findChild(temp, "state"));
				try {
					this.respActions = engine.firstExpr(findChild(temp, "actions"));
				} catch(error) {}
				break;
			case "events":
				for ( j = 0; j < temp.children.length; j++) {
					this.events[temp.children[j].nodeName] = engine.firstExpr(temp.children[j]);
				}
				break;
			case "accept":
				for ( j = 0; j < temp.children.length; j++) {
					this.listeners[temp.children[j].getAttribute("applet")] = {
						data : temp.children[j].getAttribute("data"),
						expr : engine.firstExpr(temp.children[j])
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
			change : function(e) {
				var id = e.currentTarget.getAttribute("id");
				var instance = applet.instances[id];
				applet.local[applet.statename] = instance;
				if (engine.evalExpr(applet.events.change, applet.local, output)) {
					//e.stopPropagation();
					e.preventDefault();
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
					//jQuery("#" + id).on(e, handlers[e]);
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
			library: {
				common: [],
				applets: []
			}
		};

		var actions = {
			redraw : function() {
				return function(applet, id) {
					applet.redraw(id);
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
							if (engine.evalExpr(target.listeners[applet.name].expr, local, output)) {
								target.broadcast(output.result);
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
							local[resultname] = xmlhttp.responseXML;
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

		var run = function() {
			var name;
			var applet;
			var elements;
			var element;
			var id;

			for (name in lib.applets) {
				applet = lib.applets[name];
				var ids = [];
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
			active = false;
		};

		temp = findChildren(xml, "common");
		for (i = 0; i < temp.length; i++) {
			if (!engine.evalStmt(temp.children[i], lib.context, output)) {
				throw "Fail";
			}
			for (prop in output) {
				this.context[prop] = output[prop];
			}
			code.library.common.push(temp.children[i]);
		}

		temp = findChildren(xml, "applet");
		for (i = 0; i < temp.length; i++) {
			name = temp[i].getAttribute("name");
			applet = new Applet(temp[i], lib.context, engine);
			this.applets[name] = applet;
			code.library.applets.push(applet);
		}

		this.context.core.code = code;

		var active = false;
		resume = function() {
			if (!active) {
				setTimeout(run, 10);
				active = true;
			}
		};
		this.run = run;
	}

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			var lib = new Library(xmlhttp.responseXML.children[0]);
			lib.run();
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}
