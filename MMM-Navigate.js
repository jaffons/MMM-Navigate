/*MMM-Navigate.js

* Magic Mirror
* Module: NewsFeed
*
* https://github.com/jaffons/MMM-Navigate
* MIT Licensed.

*/

var locked = false;
var confirm = 0;
var selectedAlarm = 0;
var selectedDay = 0;

class Alarm {
	constructor(hour, min, days) {
		this.hour = hour;
		this.minute = min;
		this.days = days;
	}
}

let alarmIdx = [
	new Alarm(6,40, [1,2,3,4,5]),
	new Alarm(4,20, [0,6])
];


Module.register("MMM-Navigate",{
	
	// Default module config.
	defaults: {
		Alias: [ 'Page increment','Page decrement'],
		Action: [{type: "notification", title: 'Good morning!'},{type: "notification", title: 'Good morning!'}],
		GPIOPins: [26,20,19]//rotary cw, rotary ccw, rotary press (BCM Numbering)
	},
	
	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
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

		this.hide(90000);
	},

	// Define start sequence.
	start: function() {		
		Log.info("Starting module: " + this.name);
		
		var self = this;

		this.sendConfig();//pass config to node_helper.js
		//Helper to test connection to node_helper.js
		//this.sendSocketNotification('START', {message: 'Starte Verbindung node_helper für ' + this.name});
		setTimeout(function(){ self.hide(10000); }, 6000);
		
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
		var adjustable_counter = 0;
		var showAttr = 0;
		var dayStr = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

		self.show(0);
		selectedid = fselectedid();

		if(payload.inputtype === 'PRESSED'){
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
				if(parseInt(selectedid) == 3) { // hardcoded selection 'days' 
					setTimeout(function(){ resetLock(selectedid); }, 15000);
					// toggle selected day. 
					if(alarmIdx[selectedAlarm].days[selectedDay] == 9) {
						alarmIdx[selectedAlarm].days[selectedDay] = selectedDay;
					}
					else { // '9' means that no alarm on that day
						alarmIdx[selectedAlarm].days[selectedDay] = 9;
					}
					
					var dayStrNotification = '';
					
					for(let i=0; i<7; i++) {
						if(alarmIdx[selectedAlarm].days[i] != 9) {
							dayStrNotification.push(dayStr[i]);
						}
					}
					self.sendAction({
								notification:"SHOW_ALERT", 
								payload:{
									type:"notification", 
									message:dayStrNotification}
								});					
				}
				else {
					locked = false;
					document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected');
					self.sendAction({
								notification: "SET_ALARM", 
									payload: {
										"hour":String(alarmIdx[selectedAlarm].hour),
										"minute":String(alarmIdx[selectedAlarm].minute),
										"days":String(alarmIdx[selectedAlarm].days)",
										"msg":"alarm set"}
								});
				}
			}
		}	 
		else if (payload.inputtype === 'CW' || payload.inputtype === 'CCW'){
			confirm = 0;

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
			else { //Menu locked
				if(payload.inputtype === 'CW') {
					adjustable_counter++;
				//	self.sendAction(self.config.Action[selectedid][0]);
				}
				else if(payload.inputtype === 'CCW') {
					adjustable_counter--;
				//	self.sendAction(self.config.Action[selectedid][1]);
				}

				/* selectedid = 0..lastIdx,
				*  0 = alarmIdx
				*  1 = hour
				*  2 = minute
				*  3 = days[]
				*/
				switch (parseInt(selectedid)) {
					case 0:
						selectedAlarm = selectedAlarm + adjustable_counter;
						selectedAlarm = limits(selectedAlarm, 0, 1);
						showAttr = selectedAlarm;
						break;
					case 1:
						alarmIdx[selectedAlarm].hour = alarmIdx[selectedAlarm].hour + adjustable_counter;
						alarmIdx[selecte  dAlarm].hour = limits(alarmIdx[selectedAlarm].hour, 0, 23);
						showAttr = alarmIdx[selectedAlarm].hour;
						break;
					case 2:
						alarmIdx[selectedAlarm].minute = alarmIdx[selectedAlarm].minute + adjustable_counter;
						alarmIdx[selectedAlarm].minute = limits(alarmIdx[selectedAlarm].minute, 0, 59);
						showAttr = alarmIdx[selectedAlarm].minute;
						break;
					case 3:
						selectedDay = selectedDay + adjustable_counter;
						selectedDay = limits(selectedDay, 0, 6);
						showAttr = dayStr[selectedDay];
						break;
						
					default:
						showAttr = "no attribute";
						console.log("DEFAULT:: show attr: " + showAttr + ", selectedID: " + selectedid);
				};

				document.getElementsByTagName('li')[selectedid].innerHTML = this.config.Alias[selectedid] + showAttr;
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
			
			
		function limits(input, min_limit, max_limit) {
			var input; var min_limit; var max_limit;
			if(input < min_limit) {input = max_limit;}
			if(input > max_limit) {input = min_limit;}
			return input;
		}
		
		function resetLock(selectedid) {
			document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected');
			locked = false;
		}
		
 		return parent
	},


	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
			//	console.log(this.name +' received notification: ' + notification);
				this.naviaction(payload);
	},
	
});
