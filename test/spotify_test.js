var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Spotify connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({ // Batch
    'A Spotify connector': { // Context
        topic: new connector.spotify, // Topic

        'should have name Spotify': function (spotify) { // Vow
            assert.equal(spotify.name, "Spotify");
        },

        'should inherit from base_connector': function(spotify) {
            assert.isFunction(spotify.execute, "but don't have base_connector function \"execute\"");
        },

        'uri generator': {
            topic: function (spotify) {
                // test data
                return params = {
                    spotify: spotify,
                    query: 'Hej',
                    apiConfig: { action: 'artistSearch', in_param: 0 }
                };
            },

            'should return a string(not empty)': function(params) {
                var url = params.spotify.getActionUrl(params.query, params.apiConfig);
                assert.isString(url);
                assert.isNotEmpty(url);
            }
        },

        'with an artistSearch action': {

			'which exists in apiActions': function(spotify) {
				assert.isObject(spotify.apiActions['artistSearch']);
        	},

        },
        
    	'can be executed': {
    		topic: function (spotify) { // async vow
                var dummyConfig = { action: 'artistSearch', in_source: null, in_param_name: "q" };
                var url = spotify.getActionUrl("hello world", dummyConfig);
                request({url: url, headers: { "Accept" : "application/json" }}, this.callback);
            },
            'and gets a response': function(error,response,result){ // async vow callback
                assert.equal(response.statusCode, 200);
            }
        }
    }
});

suite.export(module);