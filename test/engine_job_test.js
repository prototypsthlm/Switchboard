/**
	Test of a Engine job (switchboard.js)
	
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('Engine job');
var engine = require('../lib/switchboard.js');
var EngineJob = require('../lib/engine_job.js');
var userConfig = require('./resources/user_config_standard.json');

var testData = {
	request: ["search query"],
	id: 1234,
	translatedConfig: engine.translateUserConfig(userConfig)
};

suite.addBatch({

	'Engine job': {

		'topic': function() {
			return new EngineJob(testData.translatedConfig, testData.request, testData.id);			
		},

		'should have a id': function (job) {
			assert.equal(job.id(), testData.id);
		},

		'should have a request': function (job) {
			assert.equal(job.request(), testData.request);
		}		
	}
});

suite.export(module);
