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

var validateResponse = function(routineName, mergeMethod) {

	var context = {
		topic: function(switchboard) {
			switchboard.addAndRunJob(routine(routineName), request(routineName), this.callback, mergeMethod);
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
		assert.isTrue(isEqual);
	};
	
	return context;
}

suite.addBatch({

	'A valid response': {

		'topic': function() {
			//Switchboard.setRequest(request);
			return Switchboard;
		},
		
		'is retrieved using the "starwars_artists" example routine': validateResponse("starwars_artists", "extractMerge"),
		'is retrieved using the "starwars_artists" example routine': validateResponse("starwars_artists", "injectMerge"),
	}
});

suite.export(module);
