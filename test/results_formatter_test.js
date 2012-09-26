var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Class resonsible for formatting all results to a mega object');
var ResultFormatter = require('../lib/results_formatter.js');
var TestResult = require('./resources/results.js');


function resultAfterMergeValidation(mergeMethod) {
	var context = {
		topic: function(topic) {
			var cleanResult;
			if(mergeMethod == "extractMerge") {
				cleanResult = topic.formatter.extractMerge();
			}
			else if(mergeMethod == "injectMerge") {
				cleanResult = topic.formatter.injectMerge();
			}
			return {cleanResult: cleanResult, formatter: topic.formatter};
		}
	};

	context['should return a valid clean result'] = function(topic) {
		var cleanResult = topic.cleanResult;
		assert.isArray(cleanResult);
		assert.deepEqual(cleanResult, new TestResult("clean", mergeMethod), "Not valid clean result");
	},

	context['should not affect the raw result'] = function(topic) {
		var formatter = topic.formatter;
		assert.deepEqual(formatter.raw(), new TestResult("raw"), "Raw result affected!");
	}

	return context;
}

suite.addBatch({ // Batch

	'Result formatter': {

		'without populated data': {
			topic: function() {
				return new ResultFormatter();
			},

	    	'should have an empty result': function(formatter) {
	    		assert.isArray(formatter.raw());
	    		assert.isEmpty(formatter.raw());
	    	},
	    },

		'with populated data': { // Context
			topic: function (formatter) {				
				var rawResult = new TestResult("raw");
				var formatter = new ResultFormatter(rawResult);				
				return {formatter: formatter, rawResult: rawResult};
			},

			'could not affect the raw result after it has been set': function (topic) {
	    		topic.rawResult.push({api:"Dummy", calls:[]});
				assert.notDeepEqual(topic.formatter.raw(), topic.rawResult, "Raw result affected after it has been set");
			},

			'could not affect the raw result after it has retrieved': function (topic) {
				var rawResult = topic.formatter.raw();
				rawResult.push({api:"Dummy", calls:[]});

				assert.notDeepEqual(topic.formatter.raw(), rawResult, "Raw result affected after it has been retrieved");
			},

			'should have a valid raw array': function(topic) {
				assert.isArray(topic.formatter.raw());
				assert.isNotEmpty(topic.formatter.raw());
			},

			'using extractMerge': resultAfterMergeValidation("extractMerge"),

			'using injectMerge': resultAfterMergeValidation("injectMerge")
/*
			{

				topic: function(formatter) {
					return {cleanResult: formatter.extractMerge(), formatter: formatter};
				},

				'should return a valid clean result': function(topic) {
					var cleanResult = topic.cleanResult;
					assert.isArray(cleanResult);
					//console.log(new TestResult("clean", "extractMerge"));
					assert.deepEqual(cleanResult, new TestResult("clean", "extractMerge"));
				},

				'should not affect the raw result': function(topic) {
					var formatter = topic.formatter;
					assert.deepEqual(formatter.raw, new TestResult("raw"), "Using extractMerge affected the raw result");
				}
			},
			*/
			/*
			'using injectMerge': {

				topic: function(formatter) {
					return formatter.injectMerge();
				},

				'should return a raw result': function(result) {
					assert.isArray(result.raw);
				},

				'should return a clean result': function(result) {
					assert.isArray(result.clean);
				},

				'should not affect the raw result': function(result) {
					assert.equal(result.raw, testResults.raw);
				}

			}
			*/
	    },

	    

	}

    
});

suite.export(module);