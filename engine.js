var $ = require('jquery');
var async = require("async");
var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');

var Engine = function() {};

Engine.prototype = (function(){
    
    var searchArray = null;
    var routine = [];
    var requestBody = new Object();
    var requestBodyArray = new Array();
    var req = null;
    var getQueries = function(querySource, connectorResponse) {
        var queries = [];
        if ("request.get" == querySource) {
            queries.push(req.query.q);    
        }
        else { //TODO : MAKE INTO MAGIC RECURSION ENGINE FROM SPACEEEE
            $.each(connectorResponse, function(i){
               $.each(connectorResponse[i].result['artists'], function(j, val) {
                    if(j >= 5) return false;
                    queries.push(val['name']);
                });
            });
        }
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
            routine = [];
            $.each(translatedConfig, function(i,a){
                var r;
                var received = null;
                var config = translatedConfig[i];
                console.log(config);
                
                if (i < 1) {
                    r = function(callback) {
                        var connector = config.connector;
                        var queries = getQueries(config.query_source, received);
                        var category = config.api_domain;
                        
                        connector.execute(queries, category, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results);
                            requestBodyArray.push(results);
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                else {
                    r = function(received, callback) {
                        var connector = config.connector;
                        var queries = getQueries(config.query_source, received);
                        var category = config.api_domain;

                        connector.execute(queries, category, function(results) {
                            console.log("routine" + i + " complete");
                            console.log(results);
                            requestBodyArray.push(results);
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                routine.push(r);
            
                /*
                if(i < 1){
                    r = function(callback){
                        translatedConfig[i].routine(searchArray, function(results){
                            console.log("routine" + i + " complete");
                            console.log(results);
                            requestBody.firstResult = results;
                            var parsedResult = spotify.handle_results(translatedConfig[i].api_domain, translatedConfig[i].key, results); //breaks out keys.
                            console.log("PARSiNG");
                            console.log(parsedResult);                            
                            callback(null, parsedResult); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }
                else {
                    r = function(received, callback){
                        translatedConfig[i].routine(received, function(results){ //fixxxa..
                            console.log("routine" + i + " complete");
                            console.log(results);
                            requestBody.secondResult = results;
                            callback(null, results); //skickar vidare items till nästa funktion i waterfall
                        });
                    };
                }*/
                
            });
        },
        runEngine: function(cb){
            async.waterfall(routine, function (err, result) {
               console.log("END");
               //console.log(JSON.stringify(requestBody));
               cb(requestBody); //res.send(JSON.stringify({ results: result }));    
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