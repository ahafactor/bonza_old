/**
 * @author Roman Movchan
 */
function Bonza() {
	function evalFormula(formula, context, output) {

		var scanner = /\s*(-?\d*\.\d+)|(-?\d+)|(\w+)|(\".*\")|('.*')|(\+)|(-)|(\*)|(\/)|(\.)|(\()|(\))|(\[)|(\])|(\{)|(\})|(:)|(,)|(<=?)|(\/?=)|(>=?)/g;
		var token = scanner.exec(formula);
		var valstack = [];
		var opstack = [];
		var result;
		var more;
		var level = 0;
		function parseFormula() {
			if (parseSubexp()) {
				if (parsePlus()) {
				}
				return true;
			} else if (parseString()) {
				return true;
			} else if (parseNumber()) {
				if (parsePlus()) {
				}
				return true;
			} else if (parseObject()) {
				return true;
			} else if (parseVar()) {
				while (parseApply() || parseIndex() || parseDot()) {
				}
				if (parsePlus()) {
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
					if (parseFormula()) {
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
							if (parseFormula()) {
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
						token = scanner.exec(formula);
						while (token !== null && token[0] === ",") {
							token = scanner.exec(formula);
							if (parseFormula()) {
								args[args.length] = result;
								token = scanner.exec(formula);
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
					result = prev[result];
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

	var core = {
		classname : function(name) {
			return "bonza-" + name;
		},
		math : {
			sin : function(x) {
				return Math.sin(x);
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
		}
	};

	function Applet(xml, context) {
		var temp;
		var prop;
		var local = [];
		temp = xml.getElementsByTagName("state");
		if (temp.length != 1) {
			throw "Fail";
		}
		var statename = temp[0].getAttribute("name");
		temp = xml.getElementsByTagName("init");
		if (temp.length != 1) {
			throw "Fail";
		}
		var idname = temp[0].getAttribute("id");
		var initState = firstExpr(temp[0].getElementsByTagName("state")[0]);
		var initActions = firstExpr(temp[0].getElementsByTagName("actions")[0]);
		temp = xml.getElementsByTagName("content");
		if (temp.length != 1) {
			throw "Fail";
		}
		var content = firstExpr(temp[0]);
		temp = xml.getElementsByTagName("respond");
		if (temp.length != 1) {
			throw "Fail";
		}
		var inputname = temp[0].getElementsByTagName("input")[0].getAttribute("name");
		var respState = firstExpr(temp[0].getElementsByTagName("state")[0]);
		var respActions = firstExpr(temp[0].getElementsByTagName("actions")[0]);
		var events = [];
		var instances = [];
		for (prop in context) {
			local[prop] = context[prop];
		}
		var redraw = function(id, instance) {
			local[statename] = instance;
			var element = document.getElementById(id);
			if (evalExpr(content, local, output)) {
				element.innerHTML = output.result;
			}
		};
		this.create = function(id) {
			local[idname] = id;
			if (evalExpr(initState, local, output)) {
				instances[id] = output.result;
				redraw(id, output.result);
			}
		};
		this.broadcast = function(msg) {
			var instance;
			for (var id in instances) {
				instance = instances[id];
				local[statename] = instance;
				local[inputname] = msg;
				if (evalExpr(respState, local, output)) {
					instances[id] = output.result;
					redraw(id, output.result);
				}
			}
		};
		this.destroy = function(id) {
			instances[id] = undefined;
		};
	}

	function Library(xml) {
		var applets = [];
		var temp;
		var name;
		var context = {
			core : core
		};
		var output = [];
		var prop;
		var actions = {
			redraw : function() {
				return function(name, id) {
					applets[name].redraw(id);
				};
			},
			send : function(target, msg) {
				return function(name, id) {
					applets[target].broadcast(msg);
				};
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
			try {
				if (expr.nodeType == 3) {
					return evalFormula(expr.nodeValue.trim(), context, output);
				}
				switch(expr.nodeName) {
				case "text":
					output.result = expr.innerHTML;
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
					temp = expr.getElementsByTagName("item");
					array.length = temp.length;
					for ( i = 0; i < array.length; i++) {
						if (evalExpr(temp[i].childNodes[0], context, result)) {
							array[i] = result.result;
						} else {
							output.result = undefined;
							return false;
						}
					}
					output.result = array;
					break;
				case "calc":
					where = expr.getElementsByTagName("where");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = where.length - 1; i >= 0; i--) {
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
					return evalExpr(firstExpr(expr), context2, output);
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
					where = expr.getElementsByTagName("where");
					for (prop in context) {
						context2[prop] = context[prop];
					}
					for ( i = where.length - 1; i >= 0; i--) {
						stmt2 = where[i].children[0];
						if (evalStmt(stmt2, context2, result)) {
							for (prop in result) {
								context2[prop] = result[prop];
							}
						} else {
							return false;
						}
					}
					return evalExpr(firstExpr(stmt), context2, result);
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
		temp = xml.getElementsByTagName("common");
		if (temp.length > 0) {
			if (temp.length > 1 || !evalStmt(temp[0], context, output)) {
				throw "Fail";
			}
			for (prop in output) {
				context[prop] = output[prop];
			}
		}

		temp = xml.getElementsByTagName("applet");
		applets.length = temp.length;
		for (var i = 0; i < temp.length; i++) {
			name = temp[i].getAttribute("name");
			applets[name] = new Applet(temp[i]);
		}
		//this.applets = applets;
		var perform = function(actions) {
			var action;
			for (var i = 0; i < actions.length; i++) {
				action = action[i];
				action();
			}
		};
		var process = function(applet, instance) {
			var input;
			var response;
			var needRedraw = false;
			for (var i = 0; i < instance.input.length; i++) {
				input = instance.input[i];
				response = applet.respond(input, context);
				instance.state = response.state;
				instance.actions = response.actions;
				needRedraw = true;
			}
			instance.input = [];
			return needRedraw;
		};
		var run = function() {
			var applet;
			var elements;
			var element;
			var instance;
			var id;
			var name;
			var content;
			var setEvents = function(applet, instance, id) {
				var local;
				var e;
				var events = {
					mousedown : function() {
						for (prop in output) {
							local[prop] = context[prop];
						}
						local[applet.statename] = instance.state;
						if (evalExpr(applet.events.mousedown, local, output)) {
							instance.input.unshift(output.result);
						}
						run();
					}
				};
				for (e in applet.events) {
					jQuery("#" + id).on(e, events[e]);
				}
			};
			var count;
			do {
				count = 0;
				for (name in applets) {
					applet = applets[name];
					elements = document.getElementsByClassName("bonza-" + name);
					for (element in elements) {
						id = element.getAttribute("id");
						if (id !== null && id !== "") {
							instance = applet.instances[id];
							if ( typeof instance == "undefined") {
								count++;
								instance = applet.init(id, context);
								applet.instances[id] = instance;
								content = applet.content(instance.state, context);
								element.innerHTML = content;
							}
						}
					}
				}
			} while(count > 0);
			for (name in applets) {
				applet = applets[name];
				for (id in applet.instances) {
					element = document.getElementById(id);
					if (element === null) {
						applet.instances[id] = undefined;
					} else {
						instance = applet.instances[id];
						if (process(applet, instance)) {
							content = applet.content(instance.state, context);
							element.innerHTML = content;
						}
						perform(instance.actions);
						instance.actions = [];
						setEvents(applet, instance, id);
					}
				}
			}
		};
		this.run = run;
	};

	return {
		evalXMLFile : function(fileName, id) {
			$("#" + id).html("<span>&nbsp;Loading...&nbsp;</span>");
			$.get(fileName, function(expr, status) {
				if (status === "success") {
					var output = { };
					$("#" + id).html("<span>&nbsp;Evaluating...&nbsp;</span>");
					if (evalExpr(expr.childNodes[0], {
						core : core
					}, output)) {
						$("#" + id).html("<span class='bonza-result'>&nbsp;" + output.result + "&nbsp;</span>");
					} else {
						$("#" + id).html("<span class='bonza-error'>&nbsp;Failed&nbsp;</span>");
					}
				} else {
					$("#" + id).html("<span class='bonza-error'>&nbsp;Status:&nbsp;" + status + "&nbsp;</span>");
				}
			}).fail(function(jqXHR, textStatus, errorThrown) {
				$("#" + id).html("<span class='bonza-error'>&nbsp;Error:&nbsp;" + textStatus + "&nbsp;</span>");
			});
		}
	};
}