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
var TestResult = require('./resources/results.js');
var TestHelper = require('../lib/test_helper.js');

// Test data
var testData = {
	request: {query: {q: "Back to the future"}},
	queries: {		
		headliner_biographies: 'Skrillex',
		starwars_artists: 'Tillbaka till framtiden',
	}
};



function routine(routineName) {
	return require('../example_routines/'+ routineName +'.json');
}

function request(routineName) {
	return {query: {q: testData.queries[routineName]}};
}
/*
suite.addBatch({

	'Data (to be used by a connector) could be retrieved': {

		'topic': function() {
			Switchboard.setRequest(testData.request);
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
*/

var validateResponse = function(routineName, mergeMethod) {

	var context = {
		topic: function(switchboard) {
			switchboard.addAndRunJob(routine(routineName), request(routineName), this.callback, mergeMethod);
			//switchboard.execute(request(routineName), this.callback, mergeMethod);
		}
	};

	context['raw result should be valid'] = function (rawResult, cleanResult) {
		var expectedRawResult = new TestResult(routineName, "raw", mergeMethod);
		console.log(rawResult);			
		var isEqual = TestHelper.compareObjects(rawResult, expectedRawResult, false);	
		assert.isTrue(isEqual);
	};
	
	context['clean result should be valid'] = function (rawResult, cleanResult) {		
		
		var expectedCleanResult = new TestResult(routineName, "clean", mergeMethod);		
		var isEqual = TestHelper.compareObjects(cleanResult, expectedCleanResult, false);	
		console.log("cleanResult\n", cleanResult);
		console.log("expectedCleanResult\n", expectedCleanResult);	
		assert.isTrue(isEqual);
	};
	
	return context;
}

// @todo: Switchboard crashes in result formatter when running tests in parallel

suite.addBatch({

	'A valid response': {

		'topic': function() {
			//Switchboard.setRequest(request);
			return Switchboard;
		},
		'is retrieved using the "headliner_biographies" example routine': validateResponse("headliner_biographies", "extractMerge"),
		//'is retrieved using the "starwars_artists" example routine': validateResponse("starwars_artists", "extractMerge"),
		'is retrieved using the "headliner_biographies" example routine': validateResponse("headliner_biographies", "injectMerge"),
		//'is retrieved using the "starwars_artists" example routine': validateResponse("starwars_artists", "injectMerge"),
	}
});

/*
suite.addBatch({

	'A valid response': {

		'topic': function() {
			Switchboard.setRequest(request);
			return Switchboard;
		},
		//'is retrieved using the "headliner_biographies" example routine': validateResponse("headliner_biographies"),
		'is retrieved using the "starwars_artists" example routine': validateResponse("starwars_artists", "extractMerge")
	}
});
*/

suite.export(module);
