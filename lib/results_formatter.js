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
        console.log("this.findConnectorResult(",connectorIndex,",",callIndex,",",index,")");
        var rawResults = this.raw();
        if(!rawResults[connectorIndex]) {
            console.log("No rawResults found for index "+connectorIndex);
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

            connectorResult = connectorCall;
            // Retrieve the next connector's results
            var nextConnectorResults = rawResults[connectorIndex+1] ? rawResults[connectorIndex+1] : null;
            if(nextConnectorResults) {
                if(!nextConnectorResults.calls.length) {
                    console.log("No data found in nextConnectorResuls. Leaving...");
                    break;
                }
                //console.log("nextConnectorResults ",nextConnectorResults);
                // Flytta så att inte meta.apiConfig ligger i calls utan direkt i "roten"
                // apiAction is used as a key when merging the result
                var apiAction = nextConnectorResults.calls[0].meta.apiConfig.action;
                // Retrieve the in source
                var inSourceString = nextConnectorResults.calls[0].meta.apiConfig.in_source;
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
                for(var j = 0; j < results.length; j++) { 
                    // Retrieve the result from the next connector   
                    console.log("I am in connector "+connectorIndex+", result at index "+j);  
                    var nextConnectorResult = this.findConnectorResult(connectorIndex+1, connectorCall.meta.index, j, false);
                    
                    if(nextConnectorResult) {
                        //console.log(nextConnectorResults.api, nextConnectorResults.calls[0].meta.apiConfig.in_source,":",nextConnectorResult.meta.query);
                        console.log("I have retrieved connector result in connector "+connectorIndex+", result at index "+j, nextConnectorResult.result);
                        
                        // Check if the query used by the next connector is retrieved from an array source or not
                        // If query was taken from an array we should merge the result in a special way
                        var arrayInSource = results[j][queryKey] instanceof Array;
                        // Store the result in a temporary variable
                        var tmpResult = results[j];

                        // Results that is retrieved using a query taken from an array should be merged in a special way
                        if(arrayInSource) {
                            console.log(queryKey+" is array!");
                            if(!(apiAction in tmpResult)) {
                                tmpResult[apiAction] = {};
                            }

                            // Merge the result using the apiAction as key of an object with the query (used to retrieve the result) as key
                            tmpResult[apiAction][nextConnectorResult.meta.query] = nextConnectorResult.result;

                            // Make sure we have an object/array we can extend
                            if(!newResults.length) {
                                newResults[0] = tmpResult instanceof Array ? [] : {};
                            }
                            // Add the result to an existing result
                            $.extend(true, newResults[newResults.length-1], tmpResult);
                        } else {
                            // If the result was retrieved using a query taken from a in source that wasn't an array it is pushed to the new result
                            tmpResult[apiAction] = nextConnectorResult.result;
                            newResults.push(tmpResult);
                        }
                        console.log("Added result to index ",newResults.length-1+" in connector",connectorIndex+", index:",index," result index",j);
                    } else if(this.config("mergeMethod") == "inject") {
                        newResults.push(results[j]);
                    } else {
                        console.warn("No result found in connector",connectorIndex+1," at index", j,"using callindex",connectorCall.meta.index);
                        break;
                    }
                }
                // Set the result to the new result. If merge method is "inject" the result isn't changed though
                connectorResult.result = newResults;
            } else {
                console.log("No next");
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