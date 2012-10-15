/**
EngineJob

@module Engine
**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");
var logger = require('./sb_tracer.js')();

function EngineJob(userConfig, translatedConfig, request, jobId) {
    var config = translatedConfig;
    var userRoutine = userConfig;

    var req = request;
    var requestBodyArray = [];
    var id = jobId >= 0 ? jobId : Math.floor((Math.random()*10000000)+1);

    function queryData(queries, callIndex) {
        logger.trace("Queries",  JSON.stringify(queries, null, 4));
        return {
            queries: queries instanceof Array ? queries : [queries],
            callIndex: callIndex
        }
    }

    function getQueries(config, connectorResponse) {        
        
        var callSessions = [];
        var querySource = config.apiConfig.in_source

        if ("entry query" == querySource) { //data point is the entry query            
            callSessions.push(queryData(req, null));
        }
        else { //extract data points from previous result
            $.each(connectorResponse, function(i){ //extract queries from previous result                
                var responseData = jpath.filter(connectorResponse[i].result, querySource);
                var queries = responseData.slice(0, config.options.limit);
                var callIndex = connectorResponse[i].meta.index;                
                callSessions.push(queryData(queries, callIndex));
            });
        }
        
        return callSessions;
    };

    /**
        builds an array of functions, with calls to different APIs, to be inputted into runEngine
    **/
    function buildRoutine(translatedConfig){

        var routine = [];
        $.each(translatedConfig, function(i,a){ //for each API-step in the routine config...
            var r;
            var received = null;
            var config = translatedConfig[i];
            
            if (i < 1) { //needed to comply with async syntax
                r = function(callback) {
                    var connector = config.connector;
                    var queryData = getQueries(config, received); //acquire queries from earlier API calls or from the entry query
                    
                    //console.log(_.uniq(queryData[0].queries));
                    
                    connector.execute(queryData, config.apiConfig, function(results) {                        
                        requestBodyArray.push({api: connector.name, calls: results}); //an API-call block is completed, append results to global routine result array                 
                        callback(null, results); //send results onward to the next function in the waterfall
                    });
                };
            }
            else { //needed to comply with async syntax
                r = function(received, callback) {
                    var connector = config.connector;
                    var queryData = getQueries(config, received);

                    //console.log(_.uniq(queryData[0].queries)); //this fucks up merge?
                                                        
                    connector.execute(queryData, config.apiConfig, function(results) {
                        requestBodyArray.push({api: connector.name, calls: results});
                        callback(null, results); //send results onward to the next function in the waterfal
                    });
                };
            }
            
            routine.push(r);
            
        });

        return routine;
    }

    /**
        executes the routine via async waterfall and returns the result once the whole routine is completed.
    **/
    this.run = function(callback){
        requestBodyArray = [];
        var routine = buildRoutine(config)
        async.waterfall(routine, function(err, result) {
            callback(requestBodyArray);         
        });
    };

    this.id = function() {
        return id;
    }

    this.request = function() {
        logger.trace(req);
        return req;
    };
    
    this.userRoutine = function() {
        return userRoutine;
    }
}

module.exports = EngineJob;