/**
* The ResultFormatter takes the response gathered by all connectors 
* and merges them to one formatted result.
*
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
               
        // logger.trace("setObjectData(obj, keys, value) ", obj, keys, value);
        //console.log("set obj", keys);
        if(obj == undefined) {
            logger.warn("Object is undefined. Doing nothing");
            return obj;
        }
        if(keys.length > 1) {
            var key = keys.splice(0,1);
            
            if(obj[key] instanceof Array && !isNaN(keys[0])) {
                keys[0] = parseInt(keys[0]);
            }
            return setObjectData(obj[key], keys, value);
        }
        
        if(keys[0] == undefined) {
            logger.trace("Replacing whole object with value");
            console.log(message);
            obj = value;
        }
        else {
            var message = (keys[0] in obj ? "Replacing" : "Updating") + "  value for key "+keys[0];
            logger.trace(message);
            console.log(message);
            if(keys[0] in obj)
            {                
                $.extend(true, obj[keys[0]], value);
            }
            else {
                obj[keys[0]] = value;
            }
            
        }
        
        return obj;
    }

    var getObjectData = function(obj, keys) { 
               
        // logger.trace("setObjectData(obj, keys, value) ", obj, keys, value);
        console.log("get obj", keys);
        if(obj == undefined) {
            logger.warn("Object is undefined. Doing nothing");
            return obj;
        }
        if(keys.length > 1) {
            var key = keys.splice(0,1);
            
            if(obj[key] instanceof Array && !isNaN(keys[0])) {
                keys[0] = parseInt(keys[0]);
            }
            return getObjectData(obj[key], keys);
        }
        
        if(keys[0] == undefined) {            
            return obj;
        }
        else if(keys[0] in obj) {            
            return obj[keys[0]];
        }
        return undefined;
    }

    /*
        Goes through the path and finds the first path part that is an array
        e.g.

        obj = [
            {
                "events": {
                    "event": [
                        {
                            "artists": [],
                            "artists": [],
                            "artists": [],
                        }
                    ]
                }
            }
        ];

        path = "events.event.artists";

        returned result would be events.event, since event is an array
    */
    var findArrayPath = function(obj, path, index) {
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

    var removeUnusedResult = function(connectorResult, inSource, indexToRemove, locateArrayInPath) {
        // Locate which path in the in source that points to an array
        // When found we want to remove that data using the indexToRemove argument
        var pathToArray = locateArrayInPath === false ? inSource : findArrayPath(connectorResult, inSource);

        if(pathToArray) {
            // Remove the part that is an array
            var insourceArray = pathToArray.split('.');
            var keyHoldingArray = insourceArray.pop();
            var path = insourceArray.join('.');

            if(insourceArray.length) {
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
        } else if(connectorResult instanceof Array){
            connectorResult.splice(indexToRemove,1);
        }
    }

    // Public function to retrieve the cloned raw data
    this.raw = function() {
        return $.extend(true, [], raw);
    };

    this.config = function(mergeMethod) {
        return mergeMethod in config ? config[mergeMethod] : undefined;
    };

    this.setConfig = function(mergeMethod, value) {
        config[mergeMethod] = value;
    };

    // Public function to set the raw result. Always cloned
    this.setRaw = function(rawResult) {
        raw = $.extend(true, [], rawResult);
    };

    var findConnectorResults = function(connectorIndex) {        
        if(!raw[connectorIndex]) {            
            return null;
        }

        // Holds all calls and their results for a given connector
        return raw[connectorIndex];
    };

    var findConnectorResponse = function(connectorIndex, index) {               
       var connectorResults = findConnectorResults(connectorIndex);

        for(var i in connectorResults.calls) {
            var connectorResponse = connectorResults.calls[i];

            if(connectorResponse.meta.index == index) {
                return connectorResponse;
            }                        
        }

        return null;
    };

    var sortByIndexAndCallIndex = function(a, b) {
        if(a.meta.callIndex < b.meta.callIndex) return -1;
        if(a.meta.callIndex > b.meta.callIndex) return 1;
        if(a.meta.index < b.meta.index) return -1;
        if(a.meta.index > b.meta.index) return 1;
        return 0;
    };

    var sortByIndex = function(a, b) {
        if(a.meta.index < b.meta.index) return -1;
        if(a.meta.index > b.meta.index) return 1;
        return 0;
    };

    this.mergeConnectorResults = function(connectorIndex) {
        var connectorResults = findConnectorResults(connectorIndex);
        
        var mergedResult = [];        
        
        connectorResults.calls.sort(sortByIndexAndCallIndex);
        var highestArrayIndex = 0;
        var resultToAdd = {};
        var prevArrayIndex = null;
        var nrOfCalls = connectorResults.calls.length;        
        
        // The connector which the current connector used as source to retrieve its data
        var sourceResponse = null;
        var arrayIndexes = {};
        var sourceResponses = {};
        var pathToArray = '';
        var indicesToRemove = [];
        var arrayIndices = {};

        for(var i = 0; i < nrOfCalls; i++) {
            var connectorResponse = connectorResults.calls[i];
            
            if(connectorIndex == 0) {
                mergedResult.push(connectorResponse.result);
                continue;
            }
            var lastCall = i == nrOfCalls-1;
            var meta = connectorResponse.meta;
            var callIndex = meta.callIndex;
            var index = meta.index;           
            var arrayIndex = meta.sourceInfo.arrayIndex;
            var detailedInSource = meta.sourceInfo.detailedInSource;
            var pathToArray = meta.sourceInfo.pathToArray;
            if(!(callIndex in sourceResponses)) {
                sourceResponses[callIndex] = findConnectorResponse(connectorIndex-1, callIndex);
            }

            var sourceResponse = sourceResponses[callIndex];
            var pathParts = detailedInSource.split('.');
            var arraySource = !isNaN(pathParts[pathParts.length-1]);
            while(pathParts.length) {
                var part = pathParts.pop();
                if(isNaN(part)) {                    
                    break;
                }
            }
            pathParts.push(meta.apiConfig.action);
            var path = pathParts.join('.');

            if(arraySource) {                
                resultToAdd[meta.query] = connectorResponse.result;
                arrayIndices[arrayIndex] = arrayIndex;
            } else {                
                resultToAdd = connectorResponse.result;
                arrayIndices[arrayIndex] = arrayIndex;
            }
            
            // If there are no more data in this connector we update the soure connector
            // If next result in this connector has data from another array we also add data
            if(resultToAdd != {}) {
                var nextArrayIndex = lastCall ? null : connectorResults.calls[i+1].meta.arrayIndex;            
                if(lastCall || nextArrayIndex != arrayIndex) {                    
                    setObjectData(sourceResponse.result, path.split('.'), resultToAdd);
                    resultToAdd = {};
                }
            }
            
            if(this.config("mergeMethod") != "extract") {
                continue;
            }

            // Remove results from the previous connector that wasn't used by this connector
            // Do that if this is the last call or if next call has another call index 
            // since we have to remove results for every call index
            var nextCallIndex = lastCall ? null : connectorResults.calls[i+1].meta.callIndex;
            if(lastCall || nextCallIndex != callIndex) {
                console.log("There are results to remove!");
                var arrayResult = jpath.filter(sourceResponse.result, pathToArray);

                // Remove results that current connector never used
                for(var indexToRemove = arrayResult.length; indexToRemove > -1; indexToRemove--) {
                    if(indexToRemove.toString() in arrayIndices) continue;
                    logger.trace("Removing data from call index",callIndex,"at ",pathToArray+"["+indexToRemove+"]");
                    removeUnusedResult(sourceResponse.result, pathToArray, indexToRemove, false);  
                }
                arrayIndices = {};
            }
        }

        return connectorIndex > 0 ? this.mergeConnectorResults(connectorIndex-1) : mergedResult;
    }

}

ResultFormatter.prototype.mergeResult = function(){
    return this.mergeConnectorResults(this.raw().length-1);
    //return this.findConnectorResult(0, null, 0, true);
};

ResultFormatter.prototype.injectMerge = function(){
    this.setConfig("mergeMethod", "inject");
    logger.debug("Using injectMerge");
    return this.mergeResult();
};

ResultFormatter.prototype.extractMerge = function(){
    this.setConfig("mergeMethod", "extract");
    logger.debug("Using extractMerge");
    return this.mergeResult();
};

module.exports = ResultFormatter;