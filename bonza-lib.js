function loadBonzaLibrary(url) {

	var core = {
		classname : function(name) {
			return "bonza-" + name;
		},
		nbsp : "&nbsp;",
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

	function ExprEngine(actions) {

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
						if (token !== null && (token[0] === "," || token[0] === "}")) {
							obj[prop] = null;
						} else
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
								if (token !== null && (token[0] === "," || token[0] === "}")) {
									obj[prop] = null;
								} else
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
						if(prev.hasOwnProperty(result)){
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

		function firstExpr(node) {
			var first = 0;
			while (node.childNodes[first].nodeType == 3 && node.childNodes[first].nodeValue.trim() == "") {
				first++;
			}
			return node.childNodes[first];
		}

		function getChildren(node) {
			var i = 0;
			var result = [];
			for(i = 0; i < node.childNodes.length; i++){
				if (node.childNodes[i].nodeType != 3 || node.childNodes[i].nodeValue.trim() != "") {
					result.push(node.childNodes[i]);
				}				
			}
			return result;
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
			
			var frmval = function(match, p1){
				if(evalFormula(p1, context, output)){
					return output.result;
				}
			};
			
			try {
				if (expr.nodeType == 3) {
					return evalFormula(expr.nodeValue.trim(), context, output);
				}
				switch(expr.nodeName) {
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
				case "no":
					output.result = [];
					break;
				case "calc":
					where = getChildren(expr);
					//where = expr.getElementsByTagName("where");
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
					if(evalExpr(temp[0], context, result)){
						action = result.result;
						if(evalExpr(firstExpr(temp[1]), context, result)){
							output.result = actions.delay(action, result.result);
						} else {
							return false;
						}						
					} else {
						return false;
					}
					break;
				case "input":
					if(evalExpr(firstExpr(expr), context, result)){						
						output.result = actions.input(result.result);
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
					/*
					where = stmt.getElementsByTagName("where");
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
					*/
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
		var local = {};
		var i;
		var j;

		temp = xml.children[0];
		if(temp.nodeName !== "state") {
			throw "Error";
		}
		var statename = temp.getAttribute("name");

		temp = xml.children[1];
		if(temp.nodeName !== "content") {
			throw "Error";
		}
		var content = engine.firstExpr(temp);

		temp = xml.children[2];
		if(temp.nodeName !== "init") {
			throw "Error";
		}
		var idname = temp.getAttribute("id");
		var initState = engine.firstExpr(temp.getElementsByTagName("state")[0]);
		var initActions = engine.firstExpr(temp.getElementsByTagName("actions")[0]);

		temp = xml.children[3];
		if(temp.nodeName !== "respond") {
			throw "Error";
		}
		var inputname = temp.getElementsByTagName("input")[0].getAttribute("name");
		var respState = engine.firstExpr(temp.getElementsByTagName("state")[0]);
		var respActions = engine.firstExpr(temp.getElementsByTagName("actions")[0]);

		temp = xml.children[4];
		if(temp.nodeName !== "events") {
			throw "Error";
		}
		var events = {};
		for ( i = 0; i < temp.children.length; i++) {
			events[temp.children[i].nodeName] = engine.firstExpr(temp.children[i]);
		}
		var instances = [];
		var input = [];
		var output = {};
		for (prop in context) {
			local[prop] = context[prop];
		}
		
		var applet = this;

		var handlers = {
			mousedown : function(event) {
				var id = event.currentTarget.getAttribute("id");
				event.stopPropagation();
				var instance = instances[id];
				local[statename] = instance;
				if (engine.evalExpr(events.mousedown, local, output)) {
					applet.respond(id, output.result);
				}
			},
			mouseup : function(event) {
				var id = event.currentTarget.getAttribute("id");
				event.stopPropagation();
				var instance = instances[id];
				local[statename] = instance;
				if (engine.evalExpr(events.mouseup, local, output)) {
					applet.respond(id, output.result);
				}
			}
		};

		this.instances = instances;
		this.create = function(id) {
			local[idname] = id;
			if (engine.evalExpr(initState, local, output)) {
				instances[id] = output.result;
				local[statename] = output.result;
				if (engine.evalExpr(content, local, output)) {
					var element = document.getElementById(id);
					element.innerHTML = output.result;
				}
				input[id] = [];
				for (var e in events) {
					jQuery("#" + id).on(e, handlers[e]);
				}
				if (engine.evalExpr(initActions, local, output)) {
					var actions = output.result;
					for(i = 0; i < actions.length; i++){
						var action = actions[i];
						action(applet, id);
					}
				}
			}
			delete local[idname];
		};
		this.exists = function(id) {
			return instances.hasOwnProperty(id);
		};
		this.redraw = function(id) {
			//local[idname] = id;
			local[statename] = instances[id];
			if (engine.evalExpr(content, local, output)) {
				var element = document.getElementById(id);
				element.innerHTML = output.result;
			}
		};
		this.respond = function(id, msg) {
			var instance = instances[id];
			//local[idname] = id;
			local[statename] = instance;
			local[inputname] = msg;
			input[id].push(msg);
		};
		this.run = function(id) {
			var instance = instances[id];
			var queue = input[id];
			//local[idname] = id;
			local[statename] = instance;
			i = 0;
			while (i < queue.length) {
				local[inputname] = queue[i];
				if (engine.evalExpr(respState, local, output)) {
					instances[id] = output.result;
					local[statename] = output.result;
					if (engine.evalExpr(respActions, local, output)) {
						var actions = output.result;
						for(j = 0; j < actions.length; j++){
							var action = actions[j];
							action(applet, id);
						}
					}
				}
				i++;
			}
			input[id] = [];
		};
		this.broadcast = function(msg) {
			var instance;
			local[inputname] = msg;
			for (var id in instances) {
				instance = instances[id];
				//local[idname] = id;
				local[statename] = instance;
				input[id].push(msg);
			}
		};
		this.destroy = function(id) {
			delete instances[id];
			delete input[id];
		};
	}

	function Library(xml) {
		var applets = {};
		var temp;
		var name;
		var output = {};
		var prop;
		var common;
		var context = { core: core };
		var actions = {
			redraw : function() {
				return function(applet, id) {
					applet.redraw(id);
				};
			},
			send : function(target, msg) {
				return function(applet, id) {
					applets[target].broadcast(msg);
				};
			},
			input : function(msg) {
				return function(applet, id) {
					applet.respond(id, msg);
				};
			},
			delay : function(action, interval) {
				return function(applet, id) {
					setTimeout(function(){action(applet, id);}, interval);
				};
			},
			get : function(url, success, error) {
				return function(applet, id) {
					jQuery.get(url, function(data, status) {
						applet.respond(id, success(data));
					}).fail(function(jqXHR, textStatus, errorThrown) {
						applet.respond(id, error(textStatus));
					});
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
			var ids = [];

			for (name in applets) {
				applet = applets[name];
				elements = document.getElementsByClassName("bonza-" + name);
				for (i = 0; i < elements.length; i++) {
					element = elements[i];
					id = element.getAttribute("id");
					if (id !== null && id !== "") {
						if (!applet.exists(id)) {
							ids.push(id);
						}
					}
				}
			}
			for (name in applets) {
				applet = applets[name];
				for (id in applet.instances) {
					element = document.getElementById(id);
					if (element === null) {
						applet.destroy(id);
					} else {
						applet.run(id);
					}
				}
			}
			for(i in ids){
				id = ids[i];
				applet.create(id);
			}
		};

		temp = xml.getElementsByTagName("common");
		if (temp.length > 0) {
			if (temp.length > 1 || !engine.evalStmt(temp[0].children[0], context, output)) {
				throw "Fail";
			}
			for (prop in output) {
				context[prop] = output[prop];
			}
		}

		temp = xml.getElementsByTagName("applet");
		//applets.length = temp.length;
		for (var i = 0; i < temp.length; i++) {
			name = temp[i].getAttribute("name");
			applet = new Applet(temp[i], context, engine);
			applets[name] = applet;
		}

		this.run = run;
	}


	jQuery.get(url, function(xml, status) {
		if (status === "success") {
			var lib = new Library(xml.children[0]);
			lib.run();
			setInterval(lib.run, 100);
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert(textStatus);
	});
}
