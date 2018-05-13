# MMM-Navigate
A module to connect a rotary encoder to MagicMirror and use it for Navigation inside of MagicMirror
I wanted to use interaction to the MagicMirror and decided to use a rotary encoder, which has 3 functions: Clockwise, Counterclockwise and Press.
These fucntions where combined to a navigation, so you have some possibilities, f.e.: Page increment/decrement, Newsfeed Article more/less details and actions for notification system.
## Installing the module
Clone this repository in your `~/MagicMirror/modules/` folder `( $ cd ~MagicMirror/modules/ )`:
````javascript
git clone https://github.com/Ax-LED/MMM-Navigate
cd MMM-Navigate
npm install # this can take a while
````
## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
{
			module: "MMM-Navigate",
			header: "Navigation",
			position: "top_left",
			config: {
					Alias: [ 'Seite vorwärts','Seite zurück', 'News - mehr Details' , 'News - weniger Details','Herunterfahren'],
					Action: [{notification:'PAGE_INCREMENT',payload:''},{notification:'PAGE_DECREMENT',payload:''},{notification:'ARTICLE_MORE_DETAILS',payload:''},{notification:'ARTICLE_LESS_DETAILS',payload:''},{notification: "REMOTE_ACTION", payload: {action: "SHUTDOWN"}}],
					GPIOPins: [26,20,19]//rotary cw, rotary ccw, rotary press (BCM Numbering)
					},
		},
````
## Configuration options

The following properties can be configured:


<table width="100%">
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>Alias</code></td>
			<td>An Array of the Alias for the navigation entries.</td>
		</tr>
		<tr>
			<td><code>Action</code></td>
			<td>An Array of Action of the Alias, for Example <code>{notification:'PAGE_INCREMENT',payload:''}</code> to send page increment to MMM-Pages Module.</td>
		</tr>
		<tr>
			<td><code>GPIOPins</code></td>
			<td>Array for Definition of GPIO-Pins (BMC) to connect the rotary encoder for the following actions: Clockwise, Counterclockwise and Press</td>
		</tr>
   </table>
