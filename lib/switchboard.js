var $ = require('jquery');
var async = require("async");
//var _ = require('underscore');

var Engine = function() {};

Engine.prototype = (function(){
    
    
    //get the resultFormatter class and all connectors
    var resultFormatter = require('./results_formatter.js');
    var connectors = require('./connectors/connectors');
    
    var searchArray = null; //deprecated?
    
    var config = null;
    var requestBody = {};
    var requestBodyArray = [];
    var req = null;
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
        var callSessions = [];
        var queries = [];
        
        //where should the data points come from?
        var querySource = config.apiConfig.in_source
        if ("request.get" == querySource) { //data point is the entry query
            queries.push(req.query.q);
            callSessions.push({queries: queries, callIndex: null});
        }
        else { //extract data points from previous result
            $.each(connectorResponse, function(i){ //extract queries from previous result
                var queryData = {};
                queryData.queries = crawlResults(querySource, connectorResponse[i]).slice(0,config.options.limit); //the actual extracted data points
                queryData.callIndex = connectorResponse[i].index; //basically the "call id", used in the results transformation for mapping an API-result to an earlier API-result 
                callSessions.push(queryData);
            });
        }
        console.log("acquired queries: ");
        console.log(queries);
          
        return callSessions;
    };
    
    /****
        PUBLIC METHODS
    ***/
    return {
        
        setRequest: function(request) {
            req = request;
        },
        setSearchArray: function(searchArrayIn) {
            searchArray = searchArrayIn;
        },
        getConnectors: function() {
            return connectors;
        },
        translateUserConfig: function(config){

            var translatedConfig = [];

            config.sort(function(a,b){
                if(a.order < b.order) return -1;
                if(a.order > b.order) return 1;
                return 0;
            });

            $.each(config, function(i,item){
               var routineObject = {};
               routineObject['connector'] = connectors.apiMap[item.api];
               routineObject.options = { limit: 5 };
               var in_source;
               if (item.order == 0){
                   in_source = "request.get";
               }
               else {
                   var prevConnect = translatedConfig[i-1].connector;
                   in_source = prevConnect.apiActions[config[i-1].action].out[config[i-1].out]
               }
               routineObject.apiConfig = { action: item.action, in_source: in_source, in_param: item.in_param };
               translatedConfig.push(routineObject);
            });
            console.log("service config built:");
            console.log(translatedConfig);
            return translatedConfig;
        },
        
        buildRoutine: function(translatedConfig){
            console.log("buildRoutine");
            config = translatedConfig;
            routine = [];
            $.each(translatedConfig, function(i,a){
                var r;
                var received = null;
                var config = translatedConfig[i];
                console.log("routine" + i);
                console.log(config);
                
                if (i < 1) {
                    r = function(callback) {
                        var connector = config.connector;
                        var queryData = getQueries(config, received);
                        
                        console.log("attempting to execute routine" + i);
                        console.log("queryData: ");
                        console.log(queryData);
                        //console.log("cleaned: ");
                        //console.log(_.uniq(queryData[0].queries));
                        
                        connector.execute(queryData, config.apiConfig, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results); //raw response from each http-request
                            
                            //how do we keep order of results? each call should have some sort of index since they get pushed when they finish not in relevance order or whatever #!!!
                            requestBodyArray.push({api: connector.name, calls: results}); 
                            
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                else {
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
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                
                routine.push(r);
                
            });
        },
        runEngine: function(cb){
            console.log("runEngine");
            requestBodyArray = [];
            async.waterfall(routine, function (err, result) {
               console.log("END");
               resultFormatter.raw = $.extend(true, [], requestBodyArray); //make a deep copy, copy objects not just references to objects
               cb(requestBodyArray, resultFormatter.extractMerge()); 
            });
        }
    }
})();

var engine = new Engine();

module.exports = {
    
    /* main */
    setRoutine: function(userRecipe){
        engine.buildRoutine(engine.translateUserConfig(userRecipe));
    },
    execute: function(request,cb){
        engine.setRequest(request); //entry query
        engine.runEngine(cb);
    },
    
    /* utility */
    setRequest: function(request){
        engine.setRequest(request);  
    },
    setSearch: function(query){
        engine.setSearchArray(query);
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
    }
}