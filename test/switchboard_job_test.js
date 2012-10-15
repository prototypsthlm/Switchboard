/**
	Test of a Engine job (switchboard.js)
	
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('A Switchboard job');
var engine = require('../lib/switchboard.js');
var SwitchboardJob = require('../lib/switchboard_job.js');
var userRoutine = require('../test_resources/test_user_routine.json');
var logger = require('../lib/sb_tracer.js')();

var testData = {
	request: ["search query"],
	machineRoutine: engine.translateUserRoutine(userRoutine)
};

suite.addBatch({

	'Switchboard job': {

		'topic': function() {
			return new SwitchboardJob(userRoutine, testData.machineRoutine, testData.request);
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
