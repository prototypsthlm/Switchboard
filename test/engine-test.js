var vows = require('vows'),
    assert = require('assert');
    
var suite = vows.describe('Switchboard engine');
var Engine = require('../lib/switchboard.js');

suite.addBatch({// Batch
    'A routine': {// Sub-Context
        topic: function() {
            return [
                {
                    "order": "0",
                    "api": "TMDB",
                    "action": "personSearch",
                    "in_param": "0",
                    "out": "0"
                },
                {
                    "order": "1",
                    "api": "TMDB",
                    "action": "personCredits",
                    "in_param": "0",
                    "out": "2"
                },
                {
                    "order": "2",
                    "api": "Google Books",
                    "action": "volumesSearch",
                    "in_param": "0",
                    "out": "2"
                }
            ];
        },
        'which is valid': {// Sub-Context
            topic: function(routine) {                

                var engine = new Engine();
                return engine.translateUserConfig(routine);
            },

            'can be translated': function (translated) {// Vow
                console.log(translated);
                assert.notEqual(topic.apiKey, "", "no api key set");
                assert.notEqual(topic.apiKey, null, "no api key set");
            },

            'is in json format': function (jsonConfig) {// Vow
                assert.notEqual(topic.apiKey, "", "no api key set");
                assert.notEqual(topic.apiKey, null, "no api key set");
            }
        }        
    } 
});

suite.export(module);