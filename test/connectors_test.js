var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Connectors');
var connectors = require('../lib/connectors/connectors');
var request = require('request');
//var querystring = require('querystring');

function connectorValid() {
	
	var context = {
		topic: function(){
			var contextName = this.context.name;
			return connectors.apiMap[contextName];
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

	context['has responceObject'] = function(con){
		assert.isArray(con.responseObject);
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

		'contains action, in_param and out arrays': function(apiActions){
			assert.isObject(apiActions);
			assert.isNotEmpty(apiActions);

			for (var action in apiActions) {
				var row = apiActions[action];
				assert.isObject(row);
				//assert.include(row, apiActionKey);			
				assert.include(row, "action", "action must be defined");
				assert.isArray(row.action);

				assert.include(row, "in_param");
				assert.isArray(row.in_param);

				assert.include(row, "out");
				assert.isArray(row.out);
			}
			
		}

	}

	return context;
};


suite.addBatch({// Batch
    'Connector': {// Context

    	'Spotify' : connectorValid(),
    	'Echonest' : connectorValid(),
    	'last.fm' : connectorValid(),
    	'Google Books' : connectorValid(),
    	'TMDB' : connectorValid()

        

        /*'existing api actions': {// Sub-Context
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
        }*/
    }
});

suite.export(module);