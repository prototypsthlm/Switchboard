/**
	Test of the Engine (switchboard.js)

	Tests made:
	Checks that given a config object and a response the returned response is valid
	
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('The Engine');
var testRoutine = require('../example_routines/starwars_artists.json');
var Switchboard = require('../index');
var EngineData = require('./resources/engine');

suite.addBatch({

	'Data (to be used by a connector) could be retrieved': {

		'topic': function() {
			var request = {query: {q: "Back to the future"}};
			Switchboard.setRequest(request);
			Switchboard.setRoutine(testRoutine);

			return Switchboard;
		},

		'using a request query': {
			topic: function(switchboard) {
	    		var engineData = new EngineData(1);
	    		return {callSessions: Switchboard.getQueries(engineData.config, null), engineData: engineData};
	    	},

	    	'it should be valid' : function (topic) {
	    		assert.deepEqual(topic.callSessions, topic.engineData.callSessions);
	    	},
		},

		'using a connector response': {
			topic: function(switchboard) {
	    		var engineData = new EngineData(2);
	    		return {callSessions: Switchboard.getQueries(engineData.config, engineData.connectorResponse), engineData: engineData};
	    	},

	    	'it should be valid' : function (topic) {
	    		assert.deepEqual(topic.callSessions, topic.engineData.callSessions);
	    	},
		}

	}
});

suite.export(module);
