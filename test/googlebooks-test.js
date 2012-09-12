var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('google books connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');
var querystring = require('querystring');

suite.addBatch({// Batch
    'a google books connector': {// Context
        'has an api key': {// Sub-Context
            topic: connector.googlebooks,// Topic

            'that is not empty': function (topic) {// Vow
                assert.notEqual(topic.apiKey, "", "no api key set");
                assert.notEqual(topic.apiKey, null, "no api key set");
            },
            'that is valid *async': {  
                topic: function (connector) {// async vow
                    var url = "https://www.googleapis.com/books/v1/volumes/zyTCAlFPjgYC?key=" + connector.apiKey;
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback); //use connector.get instead?
                },
                'gets a response': function(error,response,result){//async vow callback
                    assert.equal(response.statusCode, 200);
                    //assert.notEqual(JSON.parse(result)['error']['code'], 400); //overkill
                }
            }
        }
    }
});

suite.addBatch({// Batch
    'a google books connectors': {// Context
        'existing api actions': {// Sub-Context
            topic: connector.googlebooks,// Topic

            'all exist and return something *async': {  
                topic: function (connector) {// async vow
                    var dummyConfig = { action: 'volumesSearch', in_source: null, in_param: 0 };
                    
                    //iterera över ALLA apiActions, bygga url:er göra anrop till dessa och verifiera att out-noderna finns i resultatet?
                    var url = connector.getActionUrl("snakes", dummyConfig);
                    console.log(url);
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback); //use connector.get instead?
                },
                'gets a response': function(error,response,result){//async vow callback
                    assert.notEqual(response.statusCode, 400);
                }
            }
        }
    }
});
suite.export(module);