/**
	Test of a Engine job (switchboard.js)
	
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('Engine job');
var engine = require('../lib/switchboard.js');
var EngineJob = require('../lib/engine_job.js');
var userRoutine = require('../test_resources/test_user_routine.json');
var logger = require('../lib/sb_tracer.js')();

var testData = {
	request: ["search query"],
	machineRoutine: engine.translateUserRoutine(userRoutine)
};

suite.addBatch({

	'Engine job': {

		'topic': function() {
			return new EngineJob(userRoutine, testData.machineRoutine, testData.request);
		},

		'should have a id': function (job) {
			assert.isNumber(job.id())
		},

		'should have a request': function (job) {
			assert.isArray(job.entryQueries());
		}		
	}
});

suite.export(module);
