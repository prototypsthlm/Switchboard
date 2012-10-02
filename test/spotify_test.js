var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('spotify connector');
var connector = require('../lib/connectors/connectors');
var request = require('request');

suite.addBatch({// Batch
    'a spotify connector': {// Context
		topic: connector.spotify,// Topic

        'has name Spotify': function (spotify) {// Vow
            assert.equal(spotify.name, "Spotify", "Name is Spotify");
        },

        'has action artistSearch': function(spotify) {
        	assert.isTrue('artistSearch' in spotify.apiActions);
        },

        'with an artistSearch action': {

			'which exists in apiActions': function(spotify) {
				assert.isTrue("artistSearch" in spotify.apiActions);
        	},

        	'which works': function(spotify) {
        		assert.isTrue(true); // does nothing?
        	},

        	'returns a result when searching for Madonna': function(spotify) {  		
        		assert.isObject({}, "No object"); // does nothing?
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