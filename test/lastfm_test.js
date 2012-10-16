/**
	Last.fm tests.
	@module Test
**/


var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Last.fm connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({ // Batch
    'A Last.fm connector': { // Context
        topic: new connector.lastfm, // Topic
        'has an api key that is valid *async': { // Sub-Context  
                topic: function (connector) { // async vow
                    var dummyConfig = { action: 'albumSearch', in_source: null, in_param_name: "album" };
                    var url = connector.getActionUrl("hello world", dummyConfig);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback);
                },
                'gets a response': function(error,response,result){ //async vow callback
                    //console.log(JSON.parse(result).error); //10 is api-key misssing
                    assert.equal(JSON.parse(result).error, null);
                    assert.equal(response.statusCode, 200);
                }
        } // end sub context
    } // end context
}); //end batch

suite.export(module);