/**
	Google Books tests.

	Tests made:
	- has an api key that is valid *async
	- has apiActions
	
	@module Test
**/

var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Google Books connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({ // Batch
    'A Google Books connector': { // Context
        topic: new connector.googlebooks, // Topic
        'has an api key that is valid *async': {  
                topic: function (connector) { // async vow
                    var dummyConfig = { action: 'volumesSearch', in_source: null, in_param_name: "q" };
                    var url = connector.getActionUrl("hello world", dummyConfig);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback); // use connector.get instead?
                },
                'gets a response': function(error,response,result){ // async vow callback
                    assert.equal(response.statusCode, 200);
                }
        },
        'has existing api actions': { // Sub-Context
            'that all exist and return something *async': {  
                topic: function (connector) { // async vow
                    // @todo: iterera över ALLA apiActions, bygga url:er göra anrop till dessa och verifiera att out-noderna finns i resultatet?
                    var dummyConfig = { action: 'volumesSearch', in_source: null, in_param_name: "q" };                    
                    var url = connector.getActionUrl("snakes", dummyConfig);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback);
                },
                'gets a response': function(error,response,result){ // async vow callback
                    assert.notEqual(response.statusCode, 400);
                }
            }
        }
    } // end context
}); //end batch

suite.export(module);