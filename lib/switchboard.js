/**
Engine takes a json configuration and executes all connectors defined in the config
in correct order, gathering the result and at the end returning a merged object with
all results.

@module Engine
**/

var $ = require('jquery');
var async = require("async");
//var _ = require('underscore');

var Engine = function() {};


var getQueriesData = [];

Engine.prototype = (function(){
    
    
    //get the resultFormatter class and all connectors
    var Formatter = require('./results_formatter.js');
    var resultFormatter = new Formatter();
    var connectors = require('./connectors/connectors');
    
    var searchArray = null; //deprecated?
    
    var requestBody = {};
    var requestBodyArray = [];
    var req = [];
    var routine;

    /****
        PRIVATE METHODS
    ***/
    /*
    recursive function that parses a JSON-tree and extracts a value from a node
    crawlPath = an array of "levels" in the tree
    tree = the JSON-tree to crawl
    queries = array of queries to be populated
    */
    var crawl = function(crawlPath, tree, queries){
        var level;
        //console.log("crawl(crawlPath, tree, queries)", crawlPath, tree, queries);
        //tree = tree.dataResult;
        //check if we should move further down in the tree
        if (!(tree instanceof Array) && crawlPath.length > 0){
            level = crawlPath.shift();
        }
        
        //console.log("LEVEL-----------------------------------------------------------------");
        //console.log(level);
        //console.log(crawlPath);
        //console.log("----------------------------------------------------------------------");
        
        //not there yet!
        if(crawlPath.length > 0){
            //the tree branches, clone the path and crawl each branch
            if (tree instanceof Array){                
                $.each(tree, function(i){
                    
                    //console.log("----------------------------------------------------------------------");
                    //console.log("branch " + i);
                    //console.log(crawlPath);
                    //console.log("----------------------------------------------------------------------");
                    
                    crawl(crawlPath.slice(0), tree[i], queries); //slice(0) => clone array
                });
            }
            //move one level down
            else{
                if(typeof tree[level] !== 'undefined')
                    crawl(crawlPath, tree[level], queries);
            }
        }
        //we found our end-node and the value(s) are extracted to queries
        else { 
            
            //console.log("----------------------------------------------------------------------");
            //console.log(tree[level]);
            //console.log("----------------------------------------------------------------------");
            
            if(tree[level] instanceof Array){
                $.each(tree[level], function(i){
                    queries.push(tree[level][i]);
                });
            }
            else {
                queries.push(tree[level]);
            }
        }
    };
    
    /*
        sets up the JSON-tree extraction
    */
    var crawlResults = function(querySource, tree){
        var extractedQueries = [];
        var crawlPath = querySource.split(".");
        crawlPath.unshift('result'); //hack
        crawl(crawlPath, tree, extractedQueries);
        return extractedQueries;
    };
    
    /*
        gets data to be sent to an API
    */
    var getQueries = function(config, connectorResponse) {
        var tmpData = {config: config, connectorResponse: connectorResponse, callSessions: null};
        //console.log("CONFIG: ", config);
        //console.log("ConnectorREsponse: ", connectorResponse);

        var callSessions = [];
        var queries = [];
        
        //where should the data points come from?
        var querySource = config.apiConfig.in_source
        if ("entry query" == querySource) { //data point is the entry query
            //queries.push(req.query.q);
            queries = req;
            callSessions.push({queries: queries, callIndex: null});
        }
        else { //extract data points from previous result
            $.each(connectorResponse, function(i){ //extract queries from previous result
                var queryData = {};

                queryData.queries = crawlResults(querySource, connectorResponse[i]).slice(0,config.options.limit); //the actual extracted data points
                
                // Before ConnectorResponse object
                //queryData.callIndex = connectorResponse[i].meta.index; //basically the "call id", used in the results transformation for mapping an API-result to an earlier API-result 
                queryData.callIndex = connectorResponse[i].meta.index;
                callSessions.push(queryData);
            });
        }
        //console.log("acquired queries: ");
        //console.log(queries);
        //console.log("callSessions: ", callSessions);

        return callSessions;
    };
    
    /****
        PUBLIC METHODS
    ***/
    return {
                
        
        getQueries: function(config, connectorResponse) {        
             return getQueries(config, connectorResponse);
        },

        setRequest: function(request) { //entry query
            req = request;
        },
        setLiveRoutine: function(userRoutine) { //entry query
            liveRoutine = userRoutine;
        },
        getConnectors: function() {
            return connectors;
        },

        /* transforms a user config to a switchboard config with references to connector objects */
        translateUserConfig: function(config){

            var translatedConfig = [];

            $.each(config, function(i,item){
               var routineObject = {};
               routineObject.connector = connectors.apiMap[item.api];
               routineObject.options = { limit: item.limit == undefined ? 5 : item.limit };
               routineObject.apiConfig = { action: item.action, in_param_name: item.in_param_name, in_source: item.value_source, };
               translatedConfig.push(routineObject);
            });
            
            return translatedConfig;
        },
        
        /*
            builds an array of functions, with calls to different APIs, to be inputted into runEngine
        */
        buildRoutine: function(translatedConfig){
            //console.log("buildRoutine");
            routine = [];
            $.each(translatedConfig, function(i,a){ //for each API-step in the routine config...
                var r;
                var received = null;
                var config = translatedConfig[i];
                //console.log("routine" + i);
                //console.log(config);
                
                if (i < 1) { //needed to comply with async syntax
                    r = function(callback) {
                        var connector = config.connector;
                        var queryData = getQueries(config, received); //acquire queries from earlier API calls or from the entry query
                        
                        console.log("attempting to execute routine" + i);
                        console.log("queryData: ");
                        console.log(queryData);
                        //console.log("cleaned: ");
                        //console.log(_.uniq(queryData[0].queries));
                        
                        connector.execute(queryData, config.apiConfig, function(results) {
                            //console.log("routine" + i + " complete");
                            //console.log(results); //raw response from each http-request
                            
                            requestBodyArray.push({api: connector.name, calls: results}); //an API-call block is completed, append results to global routine result array
                            
                            callback(null, results); //send results onward to the next function in the waterfall
                        });
                    };
                }
                else { //needed to comply with async syntax
                    r = function(received, callback) {
                        var connector = config.connector;
                        var queryData = getQueries(config, received);

                        console.log("attempting to execute routine" + i);
                        console.log("queryData: ");
                        console.log(queryData);
                        //console.log("cleaned: ");
                        //console.log(_.uniq(queryData[0].queries)); //this fucks up merge?
                                                            
                        connector.execute(queryData, config.apiConfig, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results); //raw response from each http-request
                            requestBodyArray.push({api: connector.name, calls: results});
                            callback(null, results); //send results onward to the next function in the waterfal
                        });
                    };
                }
                
                routine.push(r);
                
            });
        },
        
        /* 
            executes the routine via async waterfall and returns the result once the whole routine is completed.
        */
        runEngine: function(cb){
            console.log("runEngine");
            requestBodyArray = [];
            async.waterfall(routine, function (err, result) {
               console.log("END");
               resultFormatter.setRaw(requestBodyArray); //make a deep copy, copy objects not just references to objects
               cb(liveRoutine, resultFormatter.extractMerge(), getQueriesData); 
               //cb(requestBodyArray, resultFormatter.injectMerge()); 
            });
        }
    }
})();

var engine = new Engine();

module.exports = {
    
    /* main */
    setRoutine: function(userRecipe){
        engine.setLiveRoutine(userRecipe);
        engine.buildRoutine(engine.translateUserConfig(userRecipe));
    },
    execute: function(request_array,cb){
        engine.setRequest(request_array); //entry query array
        engine.runEngine(cb);
    },
    
    /* utility */
    setRequest: function(request){
        engine.setRequest(request);  
    },
    connectors: function(){
        return engine.getConnectors();
    },
    translateUserConfig: function(userConfig){
        return engine.translateUserConfig(userConfig);
    },
    buildRoutine: function(translatedConfig){
        engine.buildRoutine(translatedConfig);
    },
    runEngine: function(cb){
        engine.runEngine(cb);
    },
    getQueries: function(config, connectorResponse) {        
         return engine.getQueries(config, connectorResponse);
    }
}