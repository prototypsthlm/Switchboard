var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('echonest connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({// Batch
    'an echonest connector': {// Context
        topic: connector.echonest, // Topic
        'has an api key that is valid *async': {// Sub-Context  
                topic: function (connector) {// async vow
                    var dummyConfig = { action: 'artistBiographies', in_source: null, in_param_name: "name" };
                    var url = connector.getActionUrl("hello world", dummyConfig);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback); //use connector.get instead?
                },
                'gets a response': function(error,response,result){//async vow callback
                    assert.equal(response.statusCode, 200);
                }
        } //end sub context
    } // end context
}); //end batch

suite.export(module);