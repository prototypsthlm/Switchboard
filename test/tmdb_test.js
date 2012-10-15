var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('tmdb connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({ // Batch
    'a tmdb connector': { // Context
        topic: new connector.tmdb, // Topic
        'has an api key that is valid *async': { // Sub-Context  
                topic: function (connector) { // async vow
                    var dummyConfig = { action: 'movieSearch', in_source: null, in_param_name: "query" };
                    var url = connector.getActionUrl("hello world", dummyConfig);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback);
                },
                'gets a response': function(error,response,result){ // async vow callback
                    assert.equal(response.statusCode, 200);
                }
        } // end sub context
    } // end context
}); //end batch

suite.export(module);