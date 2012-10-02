var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Switchboard engine');
var engine = require('../lib/switchboard.js');

var userConfig = require('./resources/user_config_standard.json');

suite.addBatch({// Batch
    'A routine': { // Context
        topic: userConfig,
        'is transformed correctly': { // Sub-Context
            topic: function(userConfig) {                
                return engine.translateUserConfig(userConfig);
            },
            'is properly translated': function (translatedConfig) {// Vow
                assert.isArray(userConfig);
                assert.isArray(translatedConfig);
        	    for(var i in translatedConfig) {
        	        assert.isObject(translatedConfig[i]);
        	        assert.isString(translatedConfig[i].connector.name);
        	        assert.isString(translatedConfig[i].connector.host);         
        	        assert.isArray(translatedConfig[i].connector.responseObject);         
        	        assert.isString(translatedConfig[i].connector.apiKey);         
        	        assert.isObject(translatedConfig[i].connector.apiActions);         
        	        assert.isObject(translatedConfig[i].options);         
        	        assert.isObject(translatedConfig[i].apiConfig);         
        	        assert.isString(translatedConfig[i].apiConfig.action);         
        	        assert.isString(translatedConfig[i].apiConfig.in_param_name);         
        	        assert.isString(translatedConfig[i].apiConfig.in_source);                	        
        	    }
            }
        }        
    } 
});

suite.export(module);