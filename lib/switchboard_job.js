/**
A SwitchboardJob takes a machine routine, builds an async waterfall executable and runs it. Each step performs
GET-requests via Connectors retrieving results and passes them on to the next step and the next Connector for
extraction of further query data and further API-calls/GET-requests.

@module Switchboard

**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");
var logger = require('./sb_tracer.js')();

/**
Instance of a SwitchboardJob.

@class SwitchboardJob 
@constructor
@param {Object} userRoutine Object specifying API-methods and API-execution order
@param {Object} machineRoutine Object specifying API-methods and API-execution order
@param {Array} entryQueries Object specifying API-methods and API-execution order
@param {Integer} jobId Object specifying API-methods and API-execution order

*/

/**
The user routine (for reference)
@property userRoutine
@type {Object}
*/
/**
The machine routine to be made into a waterfall routine
@property machineRoutine
@type {Object}
*/
/**
A jobs progression (retrieved API-results) is appended here.
@property jobResult
@type {Array}
*/
/**
Array of queries to initiate the job.
@property entryQueries
@type {Array}
*/
/**
The job ID
@property id
@type {Integer}
*/


function SwitchboardJob(userRoutine, machineRoutine, entryQueries, jobId) {
    
    var machineRoutine = machineRoutine;
    var userRoutine = userRoutine;

    var entryQueries = entryQueries instanceof Array ? entryQueries : [entryQueries];
    var jobResult = [];
    var id = jobId >= 0 ? jobId : Math.floor((Math.random()*10000000)+1);

    function findArrayPath(obj, path, index) {
        logger.trace("findArrayPath(obj,",path,",",index,")");
        var lastPath, objPart;
        index = index == undefined ? 0 : index;

        var pathArray = path.split('.');
        var pathPart = pathArray[index];  

        if(obj) {
            if(obj[pathPart] instanceof Array) {
                pathArray.splice(index+1,pathArray.length);
                return pathArray.join('.');
            } else {                
                return findArrayPath(obj[pathPart], path, ++index);
            }
        }
        
        return null;
    }



    function queryData(queries, callIndex, sourceInfo) {
        logger.debug("Queries",  JSON.stringify(queries, null, 4));
        queries = queries instanceof Array ? queries : [queries];
        if(sourceInfo == undefined) {
            sourceInfo = [{query: queries[0], pathToArray: null, arrayIndex: null, queryIndex: 0}];
        }
        return {
            queries: queries,
            callIndex: callIndex,
            sourceInfo: sourceInfo
        }
    }
    
    /**
    Extracts query data from a previous Connectors ConnectorResponse via jpath.

    @method extractQueries
    @protected
    @param {Object} machineRoutineObject A routine step configuration.
    @param {Object} connectorResponse Object containting previous Connectors results.
    @return {Array} Returns an array of query data to be executed by a Connector
    
    */
    

function detailedInSources(result, querySource) {
    var paths = [];    
    var arrayPath = findArrayPath(result, querySource);    
    if(arrayPath) {
        var data = jpath.filter(result, arrayPath);
        var newQuerySource = querySource.substring(arrayPath.length+1); 
        for(var d in data) {
            var path = arrayPath + '.' + d;
            var arrayPath2 = detailedInSources(data[d], newQuerySource);
            if(arrayPath2.length) {
                for(var i in arrayPath2) {                    
                    paths.push(path + "." + arrayPath2[i]);    
                }                
            }
            else {                
                if(newQuerySource) {
                    path += "." + newQuerySource;
                }               
                paths.push(path);
            }
        }
    }

    return paths;
}

    function extractQueries(machineRoutineObject, connectorResponse) {        
        
        var callSessions = [];
        var querySource = machineRoutineObject.apiConfig.in_source

        if ("entry query" == querySource) { // data point is the entry query            
            callSessions.push(queryData(entryQueries, null));
        }
        else if(connectorResponse != null) { // extract data points from previous result            
            $.each(connectorResponse, function(i){                
                var path = querySource.substring(0,querySource.lastIndexOf('.'));
                var sourceInfo = [];
                var responseData = [];
                var inSources = detailedInSources(connectorResponse[i].result, querySource);
                // Om det visar sig att vi endast behöver detailedInSource då kan vi
                // Använda filter nedan.                 
                console.log("inSources ", inSources, inSources.length, jpath.filter(connectorResponse[i].result, querySource).length);
                var index = 0;
                var arrayPath = findArrayPath(connectorResponse[i].result, path);
                if(arrayPath) {
                    var data = jpath.filter(connectorResponse[i].result, arrayPath);
                    console.log("data.lenth ", data.length);
                    var newQuerySource = querySource.substring(arrayPath.length+1);                    
                    var arrayIndex = 0;
                    var queryIndex = 0;
                    for(var d = 0; d < data.length; d++) {                        
                        var tmp = jpath.filter(data[d], newQuerySource);
                        if(tmp.length) {
                            for(var t in tmp) {
                                var query = tmp[t];                            
                                responseData.push(query);                                
                                sourceInfo.push({query: query, pathToArray: arrayPath, detailedInSource: inSources[index++], arrayIndex: arrayIndex, queryIndex: parseInt(t)});
                            }
                        } else {
                            index++;
                        }
                        arrayIndex++;
                    }
                } else {
                    responseData = jpath.filter(connectorResponse[i].result, querySource);
                    for(var j in responseData) {
                        sourceInfo.push({query: responseData[j], pathToArray: '', arrayIndex: null, queryIndex: parseInt(j)});                        
                    }
                }
                //console.log("sourceInfo", sourceInfo);
                var queries = responseData.slice(0, machineRoutineObject.options.limit);
                var callIndex = connectorResponse[i].meta.index;                
                callSessions.push(queryData(queries, callIndex, sourceInfo));
            });
        }

        return callSessions;

    };

    /**
    Builds an array of functions, with calls to different APIs, to be inputted into run and executed
    by async.waterfall

    @method buildWaterfallRoutine
    @protected
    @param {Object} machineRoutine Routine with references to Connector instances
    @return {Array} Returns an array of functions to be run by async.waterfall
    
    */
    
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
    Executes the job routine via async waterfall.

    @method run
    @param {Function} callback Callback to be executed upon completion
    
    */
    
    this.run = function(callback){
        jobResult = [];
        var routine = buildWaterfallRoutine(machineRoutine)
        async.waterfall(routine, function(err, result) {
            callback(err, jobResult);         
        });
    };

    /**
    Returns the job ID
    
    @method id
    
    */

    this.id = function() {
        return id;
    }

    /**
    Returns the jobs entry queries
    
    @method entryQueries
    
    */

    this.entryQueries = function() {
        logger.trace(entryQueries);
        return entryQueries;
    };
    
    /**
    Returns the jobs user routine
    
    @method userRoutine
    
    */
    
    this.userRoutine = function() {
        return userRoutine;
    }
}

module.exports = SwitchboardJob;