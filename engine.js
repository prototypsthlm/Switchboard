var $ = require('jquery');
var async = require("async");
//var _ = require('underscore');

var Engine = function() {};

Engine.prototype = (function(){
    
    var resultFormatter = require('./result_formatter.js');
    var searchArray = null;
    var config = null;
    var requestBody = {};
    var requestBodyArray = [];
    var req = null;
    var routine;
        
    var crawl = function(crawlPath, tree, queries){
        var level;
        if (!(tree instanceof Array) && crawlPath.length > 0){
            level = crawlPath.shift();
        }
        
        //console.log("LEVEL----------------------------------------------------------------------");
        //console.log(level);
        //console.log(crawlPath);
        //console.log("----------------------------------------------------------------------");
        
        if(crawlPath.length > 0){
            if (tree instanceof Array){                
                $.each(tree, function(i){
                    
                    //console.log("----------------------------------------------------------------------");
                    //console.log("branch " + i);
                    //console.log(crawlPath);
                    //console.log("----------------------------------------------------------------------");
                    
                    crawl(crawlPath.slice(0), tree[i], queries); //slice(0) => clone array
                });
            }
            else{
                if(typeof tree[level] !== 'undefined')
                    crawl(crawlPath, tree[level], queries);
            }
        }
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
    
    var crawlResults = function(querySource, tree){
        var extractedQueries = [];
        var crawlPath = querySource.split(".");
        crawlPath.unshift('result'); //hack
        crawl(crawlPath, tree, extractedQueries);
        return extractedQueries;
    };
    
    var getQueries = function(config, connectorResponse) {
        var callSessions = [];
        var queries = [];
        var querySource = config.apiConfig.in_source
        if ("request.get" == querySource) {
            queries.push(req.query.q);
            callSessions.push({queries: queries, callIndex: null});
            //queries.push("star trek");
        }
        else {
            $.each(connectorResponse, function(i){ //extract queries from previous result
                //queries = queries.concat(crawlResults(querySource, connectorResponse[i]).slice(0,config.options.limit)); //limit from EACH query
                var queryData = {};
                queryData.queries = crawlResults(querySource, connectorResponse[i]).slice(0,config.options.limit);
                queryData.callIndex = connectorResponse[i].index; //basic. "call id"
                callSessions.push(queryData);
            });
        }
        console.log("acquired queries: ");
        console.log(queries);
          
        return callSessions;
    };
    
    return {
        
        setRequest: function(request) {
            req = request;
        },
        setSearchArray: function(searchArrayIn) {
            searchArray = searchArrayIn;
        },
        
        buildRoutine: function(translatedConfig){
            console.log("buildRoutine");
            config = translatedConfig;
            routine = [];
            $.each(translatedConfig, function(i,a){
                var r;
                var received = null;
                var config = translatedConfig[i];
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
    setRequest: function(request){
      engine.setRequest(request);  
    },
    setSearch: function(query){
        engine.setSearchArray(query);
    },
    buildRoutine: function(translatedConfig){
        engine.buildRoutine(translatedConfig);
    },
    runEngine: function(cb){
        engine.runEngine(cb);
    }
}