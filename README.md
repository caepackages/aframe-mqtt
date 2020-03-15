# aframe-mqtt

## NPM

```
npm i aframe-mqtt
```

```javascript
// main.js
require('aframe-mqtt');
```

## Browserify

```
browserify main.js -o bundle.js
```

## Properties
```
derived from animation component
```

## Example 1: Set HTML Attributes

```html
<html>
  <head>
	<script src="bundle.js"></script>
  </head>
  <body>
    <a-scene>
      <!-- default broker: test.mosquitto.org:8081 -->
      <a-box position = "0 0 0" scale = "1 1 1"
		mqtt-subscribe__pos = "topic:atest;property:position;dur:2000"
		mqtt-subscribe__size = "topic:atest;property:scale;dur:1000"		
		mqtt-publish = "topic:atest;message:1 2 3" ></a-box>
    </a-scene>
  </body>
</html>
```

## Example "Delock Power Switch" with local broker

```html
<html>
  <head>
  </head>
    <script src="bundle.js"></script>  
  <body>
    <a-scene >
      <a-box 
	  mqtt-publish = "broker:mqtt://127.0.0.1:8081;topic:cmnd/delock/power;message:TOGGLE" ></a-box>  
    </a-scene>
  </body>
</html>
```

## local mqtt-broker

<a href="http://www.mosquitto.org/">mosquitto.org</a>
```
mosquito –v –c mosquitto.conf
```

## mosquitto.conf

```
listener 1883
protocol mqtt

listener 8081
protocol websockets
```

## ipconfig

```
broker_ip (e.g. 192.168.178.92)
```

## Configure "Delock WLAN Power Socket Switch"

```
host = broker_ip
port = 1883
```

## License
```
(c) Copyright 2020 Frank Rettig, all rights reserved.
```
