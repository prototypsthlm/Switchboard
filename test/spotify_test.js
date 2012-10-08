var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('spotify connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({// Batch
    'Spotify connector': {// Context
        topic: connector.spotify,// Topic

        'should have name Spotify': function (spotify) {// Vow
            assert.equal(spotify.name, "Spotify");
        },

        'should inherit from base_connector': function(spotify) {
            assert.isFunction(spotify.execute, "but don't have base_connector function \"execute\"");
        },

        'uri generator': {
            topic: function (spotify) {
                // test data
                return params = {
                    query: 'Hej',
                    apiConfig: { action: 'artistSearch', in_param: 0 }
                };
            },

            'should return a string(not empty)': function(params) {
                var url = connector.spotify.getActionUrl(params.query, params.apiConfig);
                assert.isString(url);
                assert.isNotEmpty(url);
            }
        },

        'with an artistSearch action': {

			'which exists in apiActions': function(spotify) {
				assert.isTrue("artistSearch" in spotify.apiActions);
        	},

        },
        
    	'can be executed': {
    		topic: function (spotify) { // async vow
                var dummyConfig = { action: 'artistSearch', in_source: null, in_param_name: "q" };
                var url = spotify.getActionUrl("hello world", dummyConfig);
                request({url: url, headers: { "Accept" : "application/json" }}, this.callback);
            },
            'and gets a response': function(error,response,result){ //async vow callback
                assert.equal(response.statusCode, 200);
            }
        }
    }
});

suite.addBatch({// Batch
    'The apiActions property': {// Context

    	topic: connector.spotify.apiActions,

    	'is an object': function(apiActions) {
    		assert.isObject(apiActions, "apiActions is an object");
    	},

		'has a artistSearch action': function(apiActions) {
    		assert.isTrue("artistSearch" in apiActions, "artistSearch is not a defined action");
    	}

        
    }
});

suite.export(module);