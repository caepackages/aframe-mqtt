mqtt = require('mqtt')
require('aframe')

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('removeanimation', {
  multiple: true,
  events: {'animationcomplete' : function (evt) {
	var name = 'animation';
	if (this.id) {
		name += '__' + this.id;
	}
		
	if (name === evt.detail.name) {
		this.el.removeAttribute(name);
		this.el.removeAttribute(this.attrName);
	}
	}},
		
	init: function () {
	  }
});   

AFRAME.registerComponent('mqtt-subscribe', {
  schema: {
      broker: { default: 'mqtt://test.mosquitto.org:8081' },
      selector: { default: '' },
      topic: { default: 'topic' },
    },

  multiple: true,
  
  init: function () {
	this.clientEvents = {};
	this.clientEvents['connect'] = this.onConnect.bind(this);
	this.clientEvents['message'] = this.message.bind(this);
	this.client  = mqtt.connect(this.data.broker);
	
	for (var key in this.clientEvents) {
		if (this.clientEvents.hasOwnProperty(key)) {
			this.addClientListener(key);
		}
	}
  },
  
  addClientListener: function (clientListenerName) {
	  this.client.on(clientListenerName, this.clientEvents[clientListenerName]);
  },

  onConnect: function () {
      this.client.subscribe(this.data.topic, this.subscribe.bind(this));
  },
  
  subscribe: function (err) {
	if (err) {
		console.log("failed to subscribe to: " + this.data.broker);
    }
  },
  
  message: function (topic, message) {

	var val = 'to:' + message.toString();
	  
	for (var prop in AFRAME.components.animation.schema) {
		if (AFRAME.components.animation.schema.hasOwnProperty(prop)) {
			if (['to', 'broker', 'selector', 'topic'].indexOf(prop) === -1) {
				var stringifyFnc = AFRAME.components.animation.schema[prop]['stringify'];	
				val += ";" + prop + ":" + stringifyFnc(this.data[prop]);
			}
		}
	}
	
	var attributeName = 'animation__mqtt';
	if (this.id !== undefined) {
      attributeName += this.id;
	}

	if (this.data.selector.length > 0) {
		var elmts = document.querySelectorAll(this.data.selector);
		for (var i = 0; i < elmts.length; ++i) {
		  elmts[i].removeAttribute(attributeName);  
		  elmts[i].setAttribute(attributeName, val);
		}
	} else {
		this.el.removeAttribute(attributeName);
		this.el.setAttribute(attributeName, val);
	}
  },
  
  update: function (oldData) {
	  // If `oldData` is empty, this means we're in the initialization process
	  if (Object.keys(oldData).length === 0) {
		// initialize 
		this.clientEvents = {};
		this.clientEvents['connect'] = this.onConnect.bind(this);
		this.clientEvents['message'] = this.message.bind(this);
		this.client  = mqtt.connect(this.data.broker);
		
		for (var key in this.clientEvents) {
			if (this.clientEvents.hasOwnProperty(key)) {
				this.addClientListener(key);
			}
		}
		return; 
	  }
	  
	  // topic changed and already connected
	  if (this.client.connected && this.data.topic !== oldData.topic) {
		this.client.unsubscribe(oldData.topic)
		this.client.subscribe(this.data.topic, this.subscribe.bind(this));
	  }
  },
  
   updateSchema: function (data) {
    var schema = AFRAME.components.animation.schema;
    this.extendSchema(schema);
    delete this.schema['to'];
  },
  
  remove: function () {
	this.client.unsubscribe(this.data.topic);
	this.client.removeAllListeners();
	this.client.end(true);
  }
});

AFRAME.registerComponent('mqtt-publish', {
  schema: {
      broker: { default: 'mqtt://test.mosquitto.org:8081' },
      topic: { default: 'topic' },
      message: { default: '' },  
    },

  multiple: true,  
  
  init: function () {
	this.clientEvents = {};
	this.clientEvents['connect'] = this.onConnect.bind(this);
	this.client  = mqtt.connect(this.data.broker);

	for (var key in this.clientEvents) {
		if (this.clientEvents.hasOwnProperty(key)) {
			this.addClientListener(key);
		}
	}
  },
  
  addClientListener: function (clientListenerName) {
	  this.client.on(clientListenerName, this.clientEvents[clientListenerName]);
  },
  
  update: function (oldData) {
	if (Object.keys(oldData).length > 0) {
		this.client.publish(this.data.topic, this.data.message);
	}
  },
  
  onConnect: function () {
	if (this.data.message.length > 0) {
	  this.client.publish(this.data.topic, this.data.message);
	}
  },  
  
  remove: function () {
	this.client.removeAllListeners();
	this.client.end(true);
  }
});
