/**
SwitchboardJob

@module Engine
**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");
var logger = require('./sb_tracer.js')();

function SwitchboardJob(userRoutine, machineRoutine, entryQueries, jobId) {
    
    var machineRoutine = machineRoutine;
    var userRoutine = userRoutine;

    var entryQueries = entryQueries instanceof Array ? entryQueries : [entryQueries];
    var jobResult = [];
    var id = jobId >= 0 ? jobId : Math.floor((Math.random()*10000000)+1);

    function queryData(queries, callIndex) {
        logger.trace("Queries",  JSON.stringify(queries, null, 4));
        return {
            queries: queries instanceof Array ? queries : [queries],
            callIndex: callIndex
        }
    }

    function extractQueries(machineRoutineObject, connectorResponse) {        
        
        var callSessions = [];
        var querySource = machineRoutineObject.apiConfig.in_source

        if ("entry query" == querySource) { // data point is the entry query            
            callSessions.push(queryData(entryQueries, null));
        }
        else { // extract data points from previous result
            $.each(connectorResponse, function(i){            
                var responseData = jpath.filter(connectorResponse[i].result, querySource);
                var queries = responseData.slice(0, machineRoutineObject.options.limit);
                var callIndex = connectorResponse[i].meta.index;                
                callSessions.push(queryData(queries, callIndex));
            });
        }

        return callSessions;

    };

    /**
        Builds an array of functions, with calls to different APIs, to be inputted into run 
    **/
    function buildWaterfallRoutine(machineRoutine){
        var waterFallRoutine = [];
        
        $.each(machineRoutine, function(i,a){ // for each API-step in the machineRoutine...
            var r;
            var received = null;
            
            if (i < 1) { // needed to comply with async syntax
                r = function(callback) {
                    try {           
                        var connector = machineRoutine[i].connector;
                        var queryData = extractQueries(machineRoutine[i], received); // acquire queries from earlier API calls or from the entry query
                    
                        //console.log(_.uniq(queryData[0].queries));
                    
                        connector.execute(queryData, machineRoutine[i].apiConfig, function(results) {                        
                            jobResult.push({api: connector.name, calls: results}); // an API-call block is completed, append results to global routine result array                 
                            callback(null, results); // send results onward to the next function in the waterfall
                        });
                    }
                    catch(e) {
                        callback(e,null);
                    }
                };
            }
            else { // needed to comply with async syntax
                r = function(received, callback) {
                    try {
                        var connector = machineRoutine[i].connector;
                        var queryData = extractQueries(machineRoutine[i], received);

                        //console.log(_.uniq(queryData[0].queries)); //this breaks merge?
                                                        
                        connector.execute(queryData, machineRoutine[i].apiConfig, function(results) {
                            jobResult.push({api: connector.name, calls: results});
                            callback(null, results); // send results onward to the next function in the waterfall
                        });
                    }
                    catch(e) {
                        callback(e,null);
                    }
                
                };
            }
            
            waterFallRoutine.push(r);
            
        });

        return waterFallRoutine;
    }

    /**
        Executes the routine via async waterfall and returns the result once the whole routine is completed.
    **/
    this.run = function(callback){
        jobResult = [];
        var routine = buildWaterfallRoutine(machineRoutine)
        async.waterfall(routine, function(err, result) {
            callback(err, jobResult);         
        });
    };

    this.id = function() {
        return id;
    }

    this.entryQueries = function() {
        logger.trace(entryQueries);
        return entryQueries;
    };
    
    this.userRoutine = function() {
        return userRoutine;
    }
}

module.exports = SwitchboardJob;