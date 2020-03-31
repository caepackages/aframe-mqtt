mqtt = require('mqtt')
require('aframe')

/* global AFRAME */
if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('mqtt-event-message', {
	schema: {
		event: {type: 'string', default: 'click'},
			message: {type: 'string', default: 'ON'},
			broker: {type: 'string', default: 'mqtt://127.0.0.1:8081'},
			topic: {type: 'string', default: 'cmnd/delock/power'},
			username: {type: 'string', default: ''},
			password: {type: 'string', default: ''}
		  },

		multiple: true,

		update: function (oldData) {
			this.events[this.data.event] = (event) => {
				var attrVal = 'broker:' + this.data.broker + 
				';topic:' + this.data.topic + 
				';autoRemove:true;message:' + this.data.message +
				';username:' + this.data.username + 
				';password:' + this.data.password;
				var uid = Math.round(Math.random() * 1e9)
				this.el.setAttribute('mqtt-publish__' + uid, attrVal );
			}
		}
	}
)

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
});   

AFRAME.registerComponent('mqtt-subscribe', {
  schema: {
      broker: { default: 'mqtt://test.mosquitto.org:8081' },  
      selector: { default: '' },
	  isStringProperty: {default: false},
      topic: { default: 'topic' },
      username: {type: 'string', default: ''},
      password: {type: 'string', default: ''}
    },

  multiple: true,
  
  init: function () {
	this.clientEvents = {};
	this.clientEvents['connect'] = this.onConnect.bind(this);
	this.clientEvents['message'] = this.message.bind(this);
	this.client  = mqtt.connect( this.data.broker, {username: this.data.username, password: this.data.password});

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

	if (this.isStringProperty === true) {
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
		var removeanimationName = 'removeanimation__mqtt';
		if (this.id !== undefined) {
		  attributeName += this.id;
		  removeanimationName += this.id;
		}

		if (this.data.selector.length > 0) {
			var elmts = document.querySelectorAll(this.data.selector);
			for (var i = 0; i < elmts.length; ++i) {
			  elmts[i].removeAttribute(attributeName);
			  elmts[i].setAttribute(removeanimationName, '');
			  elmts[i].setAttribute(attributeName, val);
			}
		} else {
			this.el.removeAttribute(attributeName);
			this.el.setAttribute(removeanimationName, '');
			this.el.setAttribute(attributeName, val);
		}
	} else {
		
		// animation component property name
		var propName = 'property'
		if (this.data.hasOwnProperty('property')) {		
			// no animation, directly set property (e.g. string values)
			if (this.data.selector.length > 0) {
				var elmts = document.querySelectorAll(this.data.selector);
				for (var i = 0; i < elmts.length; ++i) {
					AFRAME.utils.entity.setComponentProperty(elmts[i], this.data[propName], message.toString());
				}
			} else {
					AFRAME.utils.entity.setComponentProperty(this.el, this.data[propName], message.toString());
			}
		} else {
			console.log("failed to property in schema: " + propName)
		}
	}
  },
  
  update: function (oldData) {
	  // If `oldData` is empty, this means we're in the initialization process
	  if (Object.keys(oldData).length === 0) {
		// initialize 
		this.clientEvents = {};
		this.clientEvents['connect'] = this.onConnect.bind(this);
		this.clientEvents['message'] = this.message.bind(this);
		this.client  = mqtt.connect( this.data.broker,{username: this.data.username, password: this.data.password});
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
      username: {type: 'string', default: ''},
      password: {type: 'string', default: ''},
      message: { default: '' },
	  active: { default: true },
	  autoRemove: { default: false }
    },

  multiple: true,  
  
  init: function () {
	this.clientEvents = {};
	this.clientEvents['connect'] = this.onConnect.bind(this);
	this.client  = mqtt.connect( this.data.broker, {username: this.data.username, password: this.data.password} );

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
	if (Object.keys(oldData).length > 0 && this.data.active === true) {
		if (this.data.autoRemove === true ) {
			this.client.publish(this.data.topic, this.data.message, () => { this.el.removeAttribute(this.attrName) });
		} else {
			this.client.publish( this.data.topic, this.data.message );
		}
	}
  },
  
  onConnect: function (evt) {
	if (this.data.active === true) {
		if (this.data.autoRemove === true ) {
			this.client.publish(this.data.topic, this.data.message, () => { this.el.removeAttribute(this.attrName) });
		} else {
			this.client.publish( this.data.topic, this.data.message );
		}
	}
  },  
  
  remove: function () {
	this.client.removeAllListeners();
	this.client.end(false);
  }
});
