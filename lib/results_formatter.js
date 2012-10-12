/**
* The ResultFormatter takes the response gathered by all connectors 
* and merges them to one clean result.
*
* @todo NODEPATHS MED NESTED ARRAYS ?! KOMMER SMÄLLA... ???
* @class ResultFormatter
* @constructor
* @param {Array} result Array holding the result gathered from all connectors
*/
var $ = require('jquery');
var jpath = require("node-jpath");
var logger = require('./sb_tracer.js')();

/**
* The constructor. The result given to the constructor is always cloned
* to ensure that the raw result isn't altered in any way
*
* @method
* @param {Array} result Array holding the result gathered from all connectors. Example: [{api: "Name of Connector A", calls: []}, {api: "Name of Connector B", calls: []}]
*/
function ResultFormatter(result, config) {    
    // raw contains the result retrieved by all connectors
    // raw cannot be accessed directly to ensure that the result is always cloned
    // Otherwise we would end up affecting the raw result while building the clean result
    var raw = typeof result != "object" ? [] : $.extend(true, [], result);
    
    var config = {     
        mergeMethod: 'extract'
    };

    if(typeof config == "object") {
        this.config = $.extend(true, this.config, config);
    }

    /*
        Updates a object with new data given a set of keys that should be traversed
        
        E.g.
        If you want to add data to the artist, e.g. website, you need to use the following data

        var obj = {                                 // The object you want to update; 
            artists: {
                artist: {
                    name: "Spice Girls"                    
                }
            },
            events: {...}
        };                                          
        keys = ['artists', 'artist', 'website'];    // The keys specifying where the updated value should be set
        value = 'http://www.thespicegirls.com/';    // The value you want to set

        setObjectData(obj, keys, value);

        obj after function is called:

        { 
            artists: {
                artist: {
                    name: "Spice Girls",
                    website: 'http://www.thespicegirls.com/'                 
                }
            },
            events: {...}
        };   

        @param {Object} obj The object you want to update
        @param {Object} keys An array with keys leading to the location in the object where you want to set your value.
        @param {Mix} value The value you want to set
    */
    var setObjectData = function(obj, keys, value) {        
        //logger.log("setObjectData(obj, keys, value) ", obj, keys, value);
        if(obj == undefined) {
            logger.warn("Object is undefined. Doing nothing");
            return obj;
        }
        if(keys.length > 1) {
            var key = keys.splice(0,1);
            if(obj[key] instanceof Array) {
                for(var i=0; i < obj[key].length; i++) {
                    return setObjectData(obj[key][i], keys, value);    
                }
            } else {
                return setObjectData(obj[key], keys, value);
            }
            
        }
        
        if(keys[0] == undefined) {
            logger.log("Replacing whole object with value");
            obj = value;
        }
        else {
            var message = (keys[0] in obj ? "Replacing" : "Updating") + "  value for key "+keys[0];
            logger.log(message);
            obj[keys[0]] = value;
        }
        
        return obj;
    }

    /*
        Goes through the last path and finds the part of the path that is an array
        e.g.

        obj = [
            {
                "events": {
                    "event": [
                        {
                            "artists": {...},
                            "artists": {...},
                            "artists": {...},
                        }
                    ]
                }
            }
        ];

        path = "events.event.artists";

        returned result would be events.event, since event is an array
    */
    var findArrayPath = function(obj, path) {
        var lastPath, objPart;

        var pathArray = path.split('.');
        var lastPart = pathArray.pop();        
        var newPath, compareObj;

        if(lastPart == path) {
            compareObj = obj;
            newPath = path;
        }
        else {
            newPath = pathArray.join('.');
            compareObj = jpath.select(obj, newPath).eq(0); 
        }
        
        if(compareObj) {
            if(compareObj[lastPart] instanceof Array) {
                return path;
            } else {                
                return findArrayPath(obj, newPath);
            }
        }
        
        return null;
    }

    var removeUnusedResult = function(connectorResult, inSource, indexToRemove) {
        // Locate which path (from the end) in the in source that points to an array
        // When found we want to remove that data using the indexToRemove argument
        var pathToArray = findArrayPath(connectorResult, inSource);
        logger.log("pathToArray: ", pathToArray);
        if(pathToArray) {
            // Remove the part that is an array
            var insourceArray = pathToArray.split('.');
            var keyHoldingArray = insourceArray.pop();
            var path = insourceArray.join('.');

            if(insourceArray.length) {
                logger.log("The key",keyHoldingArray,path);
                var resultHoldingArray = jpath.filter(connectorResult, path);
                if(resultHoldingArray instanceof Array) {
                    for(var i in resultHoldingArray) {
                        resultHoldingArray[i][keyHoldingArray].splice(indexToRemove,1); // remove one at indexToRemove
                    }
                } else {
                    resultHoldingArray[keyHoldingArray].splice(indexToRemove,1);
                }
            }
            else {
                connectorResult[keyHoldingArray].splice(indexToRemove,1);
            }
        } else {
            connectorResult.splice(indexToRemove,1);
        }
    }

    // Public function to retrieve the cloned raw data
    this.raw = function() {
        return $.extend(true, [], raw);
    };

    this.config = function(typeOfConfig) {
        return typeOfConfig in config ? config[typeOfConfig] : undefined;
    };

    this.setConfig = function(typeOfConfig, value) {
        config[typeOfConfig] = value;
    };

    // Public function to set the raw result. Always cloned
    this.setRaw = function(rawResult) {
        raw = $.extend(true, [], rawResult);
    };

    

    // Finds a result from a connector and merges the result from the following connector (if found)
    this.findConnectorResult = function(connectorIndex, callIndex, index, returnOnlyResult) {
        logger.log("this.findConnectorResult(",connectorIndex,",",callIndex,",",index,")");
        var rawResults = this.raw();
        if(!rawResults[connectorIndex]) {
            logger.log("No rawResults found for index "+connectorIndex);
            return undefined;
        }

        // Holds all calls and their results for a given connector
        var connectorResults = rawResults[connectorIndex];
        
        // Hold the connector result for the given input params, i.e. callIndex and index
        var connectorResult = null;

        // Go through all calls and find the one we want, i.e. where callIndex and index matches
        // When found check if the following connector's results exists and add it to the current result

        // @todo Fundera på om det går att använda jpath för att hämta rätt resultat istället för att loopa
        for(var i in connectorResults.calls) {
            var connectorCall = connectorResults.calls[i];

            // Make sure we are using the results from the right call
            if(!(connectorCall.meta.callIndex == callIndex && connectorCall.meta.index == index)) {            
                continue;
            }
            
            // @todo: Flytta meta.apiConfig till samma ställe som api och calls ligger
            // Flytta då in namnet på api i apiConfig. apiConfig kanske ska döpas om oxå
            // @todo? Add limit to meta

            // @todo: Results generated deeper down in the chain is not removed correctly

            connectorResult = connectorCall;
            // Retrieve the next connector's results
            var nextConnectorResults = rawResults[connectorIndex+1] ? rawResults[connectorIndex+1] : null;
            if(nextConnectorResults) {
                if(!nextConnectorResults.calls.length) {
                    logger.log("No data found in nextConnectorResuls. Leaving...");
                    break;
                }
                //logger.log("nextConnectorResults ",nextConnectorResults);
                // Flytta så att inte meta.apiConfig ligger i calls utan direkt i "roten"
                // apiAction is used as a key when merging the result
                var apiAction = nextConnectorResults.calls[0].meta.apiConfig.action;
                // Retrieve the in source
                var inSourceString = nextConnectorResults.calls[0].meta.apiConfig.in_source;
                var nrOfResultsInSource = jpath.filter(connectorResult.result, inSourceString).length;
                // Make an array of the in source so that we later can remove the last part of it and store it
                var inSourceArray = inSourceString.split('.');
                // Remove the last part of the in source and store it.
                // Is used to detect if the source contains data from an array or not                
                var queryKey = inSourceArray.pop();
                // Reset the in source so that it doesn't have the last portion of the path
                inSourceString = inSourceArray.join('.');
                // Retrieve all results matching the in source
                var results = jpath.filter(connectorResult.result, inSourceString);

                // Array holding all new results since we may want to remove results that
                // wasn't used by another connector. If merge method is "inject" result is unchanged.
                var newResults = [];

                // Go through all results and add the result from next connector
                for(var j = results.length-1; j >= 0; j--) { 
                //for(var j = 0; j < results.length; j++) { 
                    var nextConnectorResult = this.findConnectorResult(connectorIndex+1, connectorCall.meta.index, j, false);
                    
                    if(nextConnectorResult) {
                        //logger.log(nextConnectorResults.api, nextConnectorResults.calls[0].meta.apiConfig.in_source,":",nextConnectorResult.meta.query);
                        logger.log("Result retrieved from the next connector. Result going to be merged in connector "+connectorIndex+", result at index "+j);
                        
                        // Check if the query used by the next connector is retrieved from an array source or not
                        // If query was taken from an array we should merge the result in a special way
                        var arrayInSource = results[j][queryKey] instanceof Array;
                        // Store the result in a temporary variable
                        var tmpResult = results[j];

                        if(arrayInSource) {
                            // If the query used by next connector was retrieved from an array
                            // (i.e. the in source points to an array) we collect in an inner
                            // loop and adds it to the result.
                            var tmpResults = [nextConnectorResult];
                            while(tmpResults.length < nrOfResultsInSource && j >= 0) {
                                var conRes = this.findConnectorResult(connectorIndex+1, connectorCall.meta.index, --j, false);                                
                                if(conRes) {
                                    tmpResults.push(conRes);
                                } else {
                                    break;
                                }                       
                            }

                            tmpResult = results[j+1];
                            tmpResult[apiAction] = {};
                             // Reverse since we are collecting data from the end to start,
                             // But we want the result to be in the right order.
                            tmpResults.reverse();
                            for(var tr in tmpResults) {
                                var res = tmpResults[tr];
                                tmpResult[apiAction][res.meta.query] = res.result;
                            }
                            
                        } else {
                            // If the result was retrieved using a query taken from a in source that wasn't an array it is pushed to the new result
                            tmpResult[apiAction] = nextConnectorResult.result;
                        }

                    } else if(this.config("mergeMethod") == "extract") {
                        logger.debug("No result found in connector",connectorIndex+1,"at index", j,"using callindex",connectorCall.meta.index,". Remove! (extract merge)!");
                        
                        removeUnusedResult(connectorResult.result, inSourceString, j);
                    }
                }
            }
            
            // We have found what we want so we can stop searching
            break;
        }

        // If returnOnlyResult == true we return only the generated result from the connector resul, i.e. not meta and raw data
        if(returnOnlyResult) {
            return connectorResult && "result" in connectorResult ? connectorResult.result : null;
        }
        // Return the whole result, i.e. with meta and raw data
        return connectorResult;
    };

}

ResultFormatter.prototype.mergeResult = function(){
    return this.findConnectorResult(0, null, 0, true);
};

ResultFormatter.prototype.injectMerge = function(){
    this.setConfig("mergeMethod", "inject");
    return this.mergeResult();
};

ResultFormatter.prototype.extractMerge = function(){
    this.setConfig("mergeMethod", "extract");
    return this.mergeResult();
};

module.exports = ResultFormatter;