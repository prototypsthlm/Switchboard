var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Switchboard engine');
var engine = require('../lib/switchboard.js');

var userRoutine = require('../test_resources/test_user_routine.json');

suite.addBatch({ // Batch
    'A routine': { // Context
        topic: userRoutine,
        'is transformed correctly': { // Sub-Context
            topic: function(userRoutine) {                
                return engine.translateUserRoutine(userRoutine);
            },
            'is properly translated': function (machineRoutine) { // Vow
                assert.isArray(userRoutine);
                assert.isArray(machineRoutine);
        	    for(var i in machineRoutine) {
        	        assert.isObject(machineRoutine[i]);
        	        assert.isString(machineRoutine[i].connector.name);
        	        assert.isString(machineRoutine[i].connector.host);         
        	        assert.isArray(machineRoutine[i].connector.responseObject);         
        	        assert.isString(machineRoutine[i].connector.apiKey);         
        	        assert.isObject(machineRoutine[i].connector.apiActions);         
        	        assert.isObject(machineRoutine[i].options);         
        	        assert.isObject(machineRoutine[i].apiConfig);         
        	        assert.isString(machineRoutine[i].apiConfig.action);         
        	        assert.isString(machineRoutine[i].apiConfig.in_param_name);         
        	        assert.isString(machineRoutine[i].apiConfig.in_source);                	        
        	    }
            }
        }        
    } 
});

suite.export(module);