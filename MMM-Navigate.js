//MMM-Navigate.js:

var locked = false;
var confirm = 0;
var adjustable_counter = 0;

var alarmSet = {
		alarmIdx:'0',
                adj_hour:'12',
                adj_minute:'59',
                adj_days:[0,1,2,3,4,5,6],
};

var A1 = new Object();
var A2 = new Object();


Module.register("MMM-Navigate",{
	// Default module config.
	defaults: {
		Alias: [ 'Page increment','Page decrement'],
		Action: [{type: "notification", title: 'Good morning!'},{type: "notification", title: 'Good morning!'}],
		GPIOPins: [26,20,19]//rotary cw, rotary ccw, rotary press (BCM Numbering)
	},

	getStyles: function() {
		return [
				this.file('MMM-Navigate.css'), //load css
			]
		},

	sendAction: function(description) {
		this.show(0,{force: true});

		if((description.payload.action == "SHUTDOWN" || description.payload.action == "RESTART" || description.payload.action == "REBOOT") && (confirm==0)){
			confirm = 1;
			this.sendNotification("SHOW_ALERT",{type:"notification",message:"For "+ description.payload.action +" please click 2nd time to proceed"});
		}else{
			confirm = 0;
			this.sendNotification(description.notification, description.payload);
		}

		this.hide(30000);
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		this.sendConfig();//pass config to node_helper.js
		//Helper to test connection to node_helper.js
		//this.sendSocketNotification('START', {message: 'Starte Verbindung node_helper für ' + this.name});
	},

	//Helper, to use module without Rotary Encoder and without GPIO Pins, like developing in Pixel VM
/*	notificationReceived: function(notification, payload) {
		/*if (notification === "HIDE_RADIO") {
		 this.hide(1000);
			this.updateDom(300);
		}
		if(notification === "CW"){
			//this.sendSocketNotification('CW',{inputtype: 'CW'});
			this.naviaction({inputtype: 'CW'});
			//console.log('ADR: notification received')
		}
		if(notification === "CCW"){
			this.naviaction({inputtype: 'CCW'});
		}
		if(notification === "PRESSED"){
			this.naviaction({inputtype: 'PRESSED'});
		}
	},*/

	// Override dom generator.
	getDom: function() {
		//Div for loading
		if (this.loading) {
			var loading = document.createElement("div");
				loading.innerHTML = this.translate("LOADING");
				loading.className = "dimmed light small";
				wrapper.appendChild(loading);
			return wrapper
		}

		var self = this;//makes variables usable in functions

		//Div after loading
		var parent = document.createElement("div");
		parent.className = "xsmall bright";
		parent.setAttribute('tabindex', 0);//set tabindex on div for focus purposes

		//build navigation from array
		for (let index = 0; index < this.config.Action.length; index++) {
			var naviItem = document.createElement("li");
			var link = document.createElement('a');
			link.setAttribute('href', '');
			link.setAttribute('target', 'iframe_a');
			//link.innerHTML = this.config.Alias[index] + '\u{1F512}'+'&#128274;';
			link.innerHTML = this.config.Alias[index];
			naviItem.setAttribute('id', index);
			if(index==0){//first li gets class="selected"
				naviItem.setAttribute('class', 'selected');
			}
			naviItem.appendChild(link);
			parent.appendChild(naviItem);
		}
		return parent
	},

	sendConfig: function() {
		this.sendSocketNotification("BUTTON_CONFIG", {
			config: this.config
		});
	},

			
	naviaction: function(payload){
		var self = this;
		var selectedid = '';


		if(payload.inputtype === 'PRESSED'){
			self.show(0);
			selectedid = fselectedid();

			if(locked==false){//Menu not locked so ... (see below)
				if(Array.isArray(self.config.Action[selectedid])){//if selected entry Action is array - lock it
					locked = true;
					document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected locked');
				}
				else{//if selected entry Action is object - so there is nothing to lock - execute it
							self.show(0,{force: true}); 
							self.sendAction(self.config.Action[selectedid]);
				}
			}
			else{ //Menu locked so unlock it
				locked = false;
				document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected');
				self.sendAction(self.config.Action[1]);
			}
		}	 
		else if (payload.inputtype === 'CW' || payload.inputtype === 'CCW'){
			confirm = 0;
			self.show(0);
			selectedid = fselectedid();

			if(locked == false) {//Menu not locked so change selection by CW and CCW
				if(payload.inputtype === 'CW') {
					if(selectedid==''){//first li gets class="selected"
						document.getElementsByTagName('li')[0].setAttribute('class', 'selected');
					}
					else if(selectedid==self.config.Action.length-1) {//last entry reached, set mark on first entry
						document.getElementsByTagName('li')[selectedid].setAttribute('class', '');
						document.getElementsByTagName('li')[0].setAttribute('class', 'selected');
					}
					else {//delete mark of selected id and mark next one
						document.getElementsByTagName('li')[selectedid].setAttribute('class', '');
						document.getElementsByTagName('li')[parseInt(selectedid)+1].setAttribute('class', 'selected');
					}
				}
				else if(payload.inputtype === 'CCW') {
					if(selectedid=='') {
						document.getElementsByTagName('li')[self.config.Action.length-1].setAttribute('class', 'selected');
					}
					else if(selectedid==0) {//first entry reached, set mark on last entry
						document.getElementsByTagName('li')[selectedid].setAttribute('class', '');
						document.getElementsByTagName('li')[self.config.Action.length-1].setAttribute('class', 'selected');
					}
					else {//delete mark of selected id and mark previous one
						document.getElementsByTagName('li')[selectedid].setAttribute('class', '');
						document.getElementsByTagName('li')[parseInt(selectedid)-1].setAttribute('class', 'selected');
					}
				}
			}
			else { //Menu locked so execute first or second payload of array (depending on CW or CCW)
				if(payload.inputtype === 'CW') {
					adjustable_counter++;
					self.sendAction(self.config.Action[selectedid][0]);
				}
				else if(payload.inputtype === 'CCW') {
					adjustable_counter--;
					self.sendAction(self.config.Action[selectedid][1]);
				}

//				console.log("adjustable counter: " + adjustable_counter + ", selectedID: " + selectedid);
				document.getElementsByTagName('li')[selectedid].innerHTML = String(adjustable_counter);
			}

		}


		function fselectedid(){//get ID and return it
			for (let index = 0; index < self.config.Action.length; index++) {
				var test = document.getElementsByTagName('li')[index].getAttribute('class');

				if(test=='selected' || test=='selected locked'){
					var selectedid = document.getElementsByTagName('li')[index].getAttribute('id');
				}
			}
			return selectedid;
		}
 		return parent
	},


	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
				console.log(this.name +' received notification: ' + notification);
				this.naviaction(payload);
	},
	
});
