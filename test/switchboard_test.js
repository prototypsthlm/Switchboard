/**
	Test of the Engine (switchboard.js)

	Tests made:
	Checks that given a config object and a response the returned response is valid
	
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('The Engine');
var $ = require('jquery');

var Switchboard = require('../index');
var TestResult = require('../test_resources/results.js');
var TestHelper = require('../lib/test_helper.js');
var logger = require('../lib/sb_tracer.js')();

// Test data
var testData = require("../test_resources/test_config.json");


var validateResponse = function(routineName, mergeMethod) {

	var context = { // Context is an actual switchboard job
		topic: function(switchboard) {
			var routine = require( testData.folderRoutines + routineName +'.json' );			// get routine from path
			var query = testData.routineTestData[routineName];									// query a.k.a. request is a string like 'Bilbo'

			// Add and run test job
			switchboard.addAndRunJob(routine, query, this.callback, mergeMethod);
		}
	};

	context['raw result should be valid'] = function (usedRoutine, formattedResult, rawResult) {

		// Get raw json from previously generated test data.
		var expectedRawResult = new TestResult(routineName, "raw");
		
		logger.trace(rawResult);
		logger.trace(expectedRawResult);

		// Incoming JSON are arrays
		assert.isArray(rawResult, "rawresult");
		assert.isArray(expectedRawResult, "expectedRaw");

		// Putting the arrays in objects.
		rawResObj = $.extend(true, {}, rawResult);
		expResObj = $.extend(true, {}, expectedRawResult);
		logger.debug(rawResObj);
		logger.debug("exp", expResObj);
		
		// Comparing the objects with our own method.
		var isEqual = TestHelper.compareObjects(rawResObj, expResObj, false);

		assert.isTrue(isEqual);
	};
	
	context['formatted result should be valid'] = function (usedRoutine, formattedResult, rawResult) {		
		
		var expectedFormattedResult = new TestResult(routineName, "formatted", mergeMethod);
		var isEqual = TestHelper.compareObjects(formattedResult, expectedFormattedResult, false);
		assert.isTrue(isEqual);
	};
	
	return context;
}

suite.addBatch({

	'A valid response': {

		'topic': function() {
			return Switchboard;
		},
		
		'is retrieved using the "starwars_artists" example routine extractMerge': validateResponse("starwars_artists", "extractMerge"),
		'is retrieved using the "starwars_artists" example routine injectMerge': validateResponse("starwars_artists", "injectMerge")
	}
});

suite.export(module);
