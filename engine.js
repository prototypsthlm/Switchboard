var $ = require('jquery');
var async = require("async");
var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');

var Engine = function() {};

Engine.prototype = (function(){
    
    var searchArray = null;
    var routine = [];
    var requestBody = {};
    var requestBodyArray = [];
    var req = null;
    
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
                    
                    crawl(crawlPath.slice(0), tree[i], queries);
                });
            }
            else{
                crawl(crawlPath, tree[level], queries);
            }
        }
        else {
            console.log("----------------------------------------------------------------------");
            console.log(tree[level]);
            console.log("----------------------------------------------------------------------");
            if(tree[level] instanceof Array){
                $.each(tree[level], function(i){
                    queries.push(tree[level][i]);
                });
            }
            else {
                queries.push(tree[level]);
            }
        }
    }
    
    var crawlResults = function(querySource, tree){
        var extractedQueries = [];
        var crawlPath = querySource.split(".");
        crawl(crawlPath, tree, extractedQueries);
        return extractedQueries;
    };
    
    var getQueries = function(querySource, connectorResponse) {
        var queries = [];
        if ("request.get" == querySource) {
            queries.push(req.query.q);
        }
        else {
            $.each(connectorResponse, function(i){
                queries = crawlResults(querySource, connectorResponse[i]);
            });
        }
        console.log("acquired queries: ");
        console.log(queries);
        return queries;
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
            routine = [];
            $.each(translatedConfig, function(i,a){
                var r;
                var received = null;
                var config = translatedConfig[i];
                console.log(config);
                
                if (i < 1) {
                    r = function(callback) {
                        var connector = config.connector;
                        var queries = getQueries(config.query_source, received).slice(0,translatedConfig[i].options.limit);
                        var category = config.api_domain;
                        
                        console.log("attempting to execute routine" + i);
                        console.log("queries: ");
                        console.log(queries);
                        
                        connector.execute(queries, category, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results); //raw response from each http-request
                            requestBodyArray.push(results);
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                else {
                    r = function(received, callback) {
                        var connector = config.connector;
                        var queries = getQueries(config.query_source, received).slice(0,translatedConfig[i].options.limit);
                        var category = config.api_domain;

                        console.log("attempting to execute routine" + i);
                        console.log("queries: ");
                        console.log(queries);
                                    
                        connector.execute(queries, category, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results); //raw response from each http-request
                            requestBodyArray.push(results);
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
               cb(requestBodyArray); 
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