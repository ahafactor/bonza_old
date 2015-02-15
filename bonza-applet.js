
	function Applet(xml) {
		var temp;
		var prop;
		var local = {};
		var i;

		temp = xml.getElementsByTagName("state");
		if (temp.length != 1) {
			throw "Fail";
		}
		this.statename = temp[0].getAttribute("name");

		temp = xml.getElementsByTagName("init");
		if (temp.length != 1) {
			throw "Fail";
		}
		this.idname = temp[0].getAttribute("id");
		this.initState = firstExpr(temp[0].getElementsByTagName("state")[0]);
		this.initActions = firstExpr(temp[0].getElementsByTagName("actions")[0]);

		temp = xml.getElementsByTagName("content");
		if (temp.length != 1) {
			throw "Fail";
		}
		this.content = firstExpr(temp[0]);

		temp = xml.getElementsByTagName("respond");
		if (temp.length != 1) {
			throw "Fail";
		}
		this.inputname = temp[0].getElementsByTagName("input")[0].getAttribute("name");
		this.respState = firstExpr(temp[0].getElementsByTagName("state")[0]);
		this.respActions = firstExpr(temp[0].getElementsByTagName("actions")[0]);

		temp = xml.getElementsByTagName("events");
		if (temp.length != 1) {
			throw "Fail";
		}
		this.events = {};
		for ( i = 0; i < events.length; i++) {
			this.events[temp[0].children[i].nodeName] = firstExpr(temp[0].children[i]);
		}
		var handlers = {
			mousedown : function(event) {
				var id = event.target.getAttribute("id");
				event.stopPropagation();
				var instance = instances[id];
				local[statename] = instance;
				if (evalExpr(events.mousedown, local, output)) {
					local[inputname] = output.result;
					if (evalExpr(respState, local, output)) {
						instances[id] = output.result;
					}
					run();
				}
			}
		};
	}

var instances = [];
var applet;

onmessage = function(e){
	if(typeof e.data.applet != "undefined"){
		postMessage(e.data.applet);
		//applet = new Applet(e.data.applet);
	}
};
