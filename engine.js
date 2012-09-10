var $ = require('jquery');
var async = require("async");
var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var _ = require('underscore');

var Engine = function() {};

Engine.prototype = (function(){
    
    var searchArray = null;
    var config = null;
    var requestBody = {};
    var requestBodyArray = [];
    var req = null;
    var routine;
    
    var pure = [];
    
    var transformResults = function(rawResults){
        console.log("TRANSFORMING RESULT");
        
        /* ALL TRANSFORM FUNCTIONS MOVED TO OWN OBJECT FOR EASIER TESTING? */
        /* COULD ALSO HELP WITH ENABLING CALL BLOCKS BEING STORED LOCALLY IN OBJECT /*/
        //return injectMerge(rawResults); //splicar in
        return extractMerge(rawResults); //resultat som inte är kopplade till anrop från andra API:er skall skalas bort
    };
    

    /*  NODEPATHS MED NESTED ARRAYS ?! KOMMER SMÄLLA... */
    var injectMerge = function(rawResults){
       $.each(rawResults,function(i,block){
           if(rawResults.length-(i+2) >= 0){
               blockInject(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]); //inject things from child block into parent block
           }
       });
       return rawResults;
    };
    
    var extractMerge = function(rawResults){
        extractedObjects = [];
        $.each(rawResults,function(i,block){ //this should be a while..?
            if(rawResults.length-(i+2) >= 0){
                if((i+2) == rawResults.length)
                    extractedObjects.push(blockExtract(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]));
                else
                    blockExtract(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]);
            }
        });
       return extractedObjects;
    };
    
    var blockExtract = function(childBlock, parentBlock){
            var objects = [];
            var leaves = childBlock.calls;
            leaves.sort(function(a,b){ //because gotten asynchronous
                if(a.index < b.index) return -1;
                if(a.index > b.index) return 1;
                return 0;
            });
            parentBlock.calls.sort(function(a,b){ //because gotten asynchronous
                if(a.index < b.index) return -1;
                if(a.index > b.index) return 1;
                return 0;
            });
            $.each(leaves,function(i,leaf){
                    var nodePath = leaf.apiConfig.in_source.split(".");
                    nodePath.pop();
                    console.log("-------------------------");
                    console.log("ATTACHING: ")
                    console.log(leaf);
                    //console.log("TO PARENT: ");
                    var tmp = []; //varför måste det vara en array här? om vanlig variabel sätts den inte
                    getNode(nodePath, parentBlock.calls[leaf.callIndex].result, leaf, tmp);
                    //nodepath borde här inte vara komplett...frågan är hur den ser ut i olika case
                    injectNode(nodePath, tmp[0], leaf);
                    objects.push(tmp[0]);
            });
            return objects;
    };
    
    var blockInject = function(childBlock, parentBlock){
            var leaves = childBlock.calls;
            leaves.sort(function(a,b){
                if(a.index < b.index) return -1;
                if(a.index > b.index) return 1;
                return 0;
            });
            parentBlock.calls.sort(function(a,b){
                if(a.index < b.index) return -1;
                if(a.index > b.index) return 1;
                return 0;
            });
            $.each(leaves,function(i,leaf){
                    var nodePath = leaf.apiConfig.in_source.split(".");
                    nodePath.pop();
                    console.log("-------------------------");
                    console.log("ATTACHING: ")
                    console.log(leaf);
                    //console.log("TO PARENT: ");
                    injectNode(nodePath, parentBlock.calls[leaf.callIndex].result, leaf);
            });
            return parentBlock;
    };
    
    var getNode =  function(nodePath, tree, leaf, objects){
        var level;
        if (!(tree instanceof Array) && nodePath.length > 0){
            level = nodePath.shift();
        }
        
        if(nodePath.length > 0){
            if(tree instanceof Array){ //nested arrays....      
                //$.each(tree, function(i){
                    console.log(leaf);
                    //getNode(nodePath.slice(0), tree[i], leaf, objects); //slice(0) => clone array
                    objects.push(tree[leaf.index]);
                //});
            }
            else{
                if(tree[level] != null)
                    getNode(nodePath, tree[level], leaf, objects);
                else
                    return tree;
            }
        }
        else {            
            if(tree[level] instanceof Array){
                console.log("ARRAY");
                console.log(nodePath);
                objects.push(tree[level][leaf.index]);
            }
            else {
                console.log("NOT ARRAY");
                console.log(nodePath);
                
                objects.push(tree[level]);
                node = tree[level]
            }
        }
    };
    
    
    var injectNode =  function(nodePath, tree, leaf){
        console.log("INJECTING NODE");
        console.log(nodePath);
        console.log(tree);
        var level;
        if (!(tree instanceof Array) && nodePath.length > 0){
            level = nodePath.shift();
        }
        
        if(nodePath.length > 0){
            if(tree instanceof Array){ //if nested arrays in nodepath this will break.....
                    injectNode(nodePath.slice(0), tree[leaf.index], leaf); //slice(0) => clone array...
            }
            else {
                if(tree[level] != null){
                    injectNode(nodePath, tree[level], leaf);                    
                }
                else{
                    console.log("INVALID NODE");
                }
                    
            }
        }
        else {            
            if(tree[level] instanceof Array){
                console.log("ARRAY");
                console.log(leaf);
                console.log("---->");
                console.log(tree[level][leaf.index]);
                tree[level][leaf.index][leaf.apiConfig.action] = leaf.result;
            }
            else {
                console.log("NOT ARRAY");
                console.log(leaf);
                console.log("---->");
                console.log(tree[level]);
                if(tree[level]  != null)
                    tree[level][leaf.apiConfig.action] = leaf.result;
                else
                    tree[leaf.apiConfig.action] = leaf.result;
            }
        }
    };
    

    
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
                //pure.push(tree);
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
            pure = [];
            async.waterfall(routine, function (err, result) {
               console.log("END");
               cb(requestBodyArray,transformResults(requestBodyArray.slice(0))); 
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