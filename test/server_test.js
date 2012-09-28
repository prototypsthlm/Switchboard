/**
	Test for the server.js

	Tests made:
	Checks that a jsonp call is wrapped with the callback param if exists

	@todo Merge batches into one batch. Hade problem with having them in the same since the server crashed when both tests were making requests
	@module: Test
**/

var vows = require('vows'),
    assert = require('assert');    
var suite = vows.describe('The starter file of Switchboard');
var connectors = require('../lib/connectors/connectors');
var request = require('request');
console.log("Server is started...")
var app = require('../server.js');
// Disable console.log, too much output in app
console.log = function () {};

// Data needed for tests
var testUrl = "http://localhost:4000/switchboard/?q=Starwars";
var callbackParam = "thisIsACallback";


function serverShouldRespond(error,response,result){ //async vow callback
 	var message = "No result. Have you started the server?";
	assert.notEqual(result, undefined, message);
}

suite.addBatch({
    'When making a request to Switchboard server': {

    	'with a "callback" query parameter': {
			topic: function () {    
				var url = testUrl + "&callback=" + callbackParam;	
				request.get(url, this.callback);
    		},  		
			
			'server should respond': serverShouldRespond,

    		'the result should be wrapped with the callback param as a function (jsonp)': function(error,response,result){//async vow callback
    			var prefix = callbackParam + "(";
    			var suffix = ")";
				var resultWrapper = result ? result.slice(0,prefix.length) + result.slice(result.length-suffix.length) : "";
				var wantedWrapper = prefix + suffix;
    			
                assert.equal(resultWrapper, wantedWrapper);
            }
    	}
    	
    }
});

suite.addBatch({
    'When making a request to Switchboard server': {

    	'with no "callback" query parameter': {
			topic: function () {    		
				request.get(testUrl, this.callback);
    		},  		
    		
    		'server should respond': serverShouldRespond,

    		'should return a valid stringified json object': function(error,response,result){//async vow callback    			
    			var json = result ? JSON.parse(result) : undefined;
                assert.typeOf(json, "object");
            }
    	}
    	
    }
});

suite.export(module);
