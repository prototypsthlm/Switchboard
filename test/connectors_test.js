/**
	General tests of all conneectors.
	@todo - getActionURL (for each connector)
	@todo - validate all apiActions
    
	@module Test
**/

var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Connectors');
var connectors = require('../lib/connectors/connectors');
var request = require('request');
var querystring = require('querystring');

function connectorValid(testLookup) {
	
	var context = {
		topic: function(){
			var contextName = this.context.name;
			return new connectors.apiMap[contextName];
		}
	};
	    
	context['should exist'] = function(con){
		assert.isObject(con);
	};

	context['should have name'] = function(con){
		assert.equal(this.context.name, con.name);
	};

	context['has http host'] = function(con){
		assert.isString(con.host);
		assert.include(con.host, 'http');
	};

	context["apiAction"] = {
		topic: function(con){
			return con.apiActions;
		},

		'is object': function(apiActions){
			assert.isObject(apiActions);
		},

		'is not empty': function(apiActions){
			assert.isNotEmpty(apiActions);
		},

		'contains action, in_param_names and output_nodes arrays': function(apiActions){
			assert.isObject(apiActions);
			assert.isNotEmpty(apiActions);

			for (var action in apiActions) {
				var row = apiActions[action];
				assert.isObject(row);

				assert.include(row, "action", "action must be defined");
				assert.isArray(row.action);

				assert.include(row, "in_param_names");
				assert.isArray(row.in_param_names);

				assert.include(row, "output_nodes");
				assert.isArray(row.output_nodes);
			}
			
		}

	},
	
	context['has an api key'] = {
        'that is not empty': function (topic) {// Vow
            assert.notEqual(topic.apiKey, "", "no api key set");
            assert.notEqual(topic.apiKey, null, "no api key set");
        }
    }

	return context;
};


suite.addBatch({// Batch
    'Connector': {// Context

    	'Spotify' : connectorValid(),
    	'Echonest' : connectorValid(),
    	'Last.fm' : connectorValid(),
    	'Google Books' : connectorValid(),
    	'TMDB' : connectorValid()
    }
});

suite.export(module);