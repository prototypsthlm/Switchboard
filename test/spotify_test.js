var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Spotify connector');
var connector = require('../lib/connectors/connectors');
//ar request = require('request');
//var querystring = require('querystring');


suite.addBatch({// Batch
    'The connector for Spotify': {// Context
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
        		assert.isTrue(true);
        	},

        	'returns a result when searching for Madonna': function(spotify) {
        		
        		assert.isObject([], "No object");
        	},

        	/*'can be executed':
        		topic: function (spotify) {// async vow
					var queryData = {};

        			spotify.execute(queryData, api_domain, cb);
                    var url = "https://www.googleapis.com/books/v1/volumes/zyTCAlFPjgYC?key=" + connector.apiKey;
                    request({url: url, headers: { "Accept" : "application/json" }}, this.callback); //use connector.get instead?
                },
                'and gets a response': function(error,response,result){//async vow callback
                    assert.equal(response.statusCode, 200);
                    //assert.notEqual(JSON.parse(result)['error']['code'], 400); //overkill
                }
*/
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