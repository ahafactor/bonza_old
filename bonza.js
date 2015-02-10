/**
 * @author Roman Movchan
 */
function BonzaInit() {
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
			} else if (parseName()) {
				if (parseApply() || parseIndex() || parsePlus()) {
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
					if (token[0] !== ")") {
						throw "Fail";
					}
					token = scanner.exec(formula);
				} else {
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
				if (token !== null && token[0] !== ")") {
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
				if (token !== null && token[0] !== "]") {
					throw "Fail";
				}
				token = scanner.exec(formula);
				level--;
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
					return false;
				}
				return true;
			} else {
				return false;
			}
		}

		function parseName() {
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
		var parser;
		var xmlDoc;
		var temp;
		var first;
		try {
			if (expr.nodeType == 3) {
				return evalFormula(expr.nodeValue.trim(), context, output);
			}
			switch(expr.nodeName) {
			case "text":
				output.result = expr.innerHTML;
				break;
			case "eval":
				first = 0;
				{
				}
				while (expr.childNodes[first].nodeType == 3 && expr.childNodes[first].nodeValue.trim() == "")
				first++;
				if (evalExpr(expr.childNodes[first], context, result)) {
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
				first = 0;
				while (expr.childNodes[first].nodeType == 3 && expr.childNodes[first].nodeValue.trim() == "")
				first++;
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
				return evalExpr(expr.childNodes[first], context2, output);
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
		var first;
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
				first = 0;
				while (expr.childNodes[first].nodeType == 3 && expr.childNodes[first].nodeValue.trim() == "")
				first++;
				return evalFormula(stmt.childNodes[first].nodeValue.trim(), context2, result);
			case "not":
				return !evalStmt(stmt.children[0], context, result);
			case "def":
				name = stmt.getAttribute("var");
				first = 0;
				while (stmt.childNodes[first].nodeType == 3 && stmt.childNodes[first].nodeValue.trim() == "")
				first++;
				if (evalExpr(stmt.childNodes[first], context, result)) {
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
				first = 0;
				while (expr.childNodes[first].nodeType == 3 && expr.childNodes[first].nodeValue.trim() == "")
				first++;
				if (evalExpr(stmt.childNodes[first], context, result)) {
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
			msec: 1.0,
			sec : 1000.0,
			date : function(d) {
				return Number(Date(d.year, d.month, d.day, 0, 0, 0, 0));
			}
		},
		format : {
			intToStr: function(i) {
				return i.toString();
			},
			numToStr: function(x) {
				return x.toString();
			},
		}
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
				$("#" + id).replaceWith("<span class='bonza-error'>&nbsp;Error:&nbsp;" + textStatus + "&nbsp;</span>");
			});
		},
		runApplet : function(lib, appname, id) {
			var applet;
			$.get(lib, function(data, status) {
				if (status === "success") {
				} else {
					$("#" + id).replaceWith("<span class='bonza-error'>&nbsp;Status:&nbsp;" + status + "&nbsp;</span>");
				}
			});
		}
	};
}