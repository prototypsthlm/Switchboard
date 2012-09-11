//should be a file called connectors that requires all connectors based on whether u have config keys set for them or not, so you dont have to include all of these..
var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var echonest = require('./Connectors/echonest.js');
var googlebooks = require('./Connectors/googlebooks.js');
var tmdb = require('./Connectors/themoviedb.js');

var express = require('express');
var app = express.createServer();
var engine = require('./engine.js');
var request = require('request');
var $ = require('jquery');

var remoteRecipe = null;

function transformChefRecipe(config){
    
    var apiMap = { //should be in connectors require file?
        "Spotify" : spotify,
        "Echonest" : echonest,
        "last.fm" : lastfm,
        "Google Books" : googlebooks,
        "TMDB" : tmdb
    }
    
    //[{"order":"2","api":"Spotify","action":"albumLookup","in_param":"0","out":"0"},{"order":"1","api":"last.fm","action":"artistGetEvents","in_param":"0","out":"0"},{"order":"0","api":"Echonest","action":"artistBiographies","in_param":"0","out":"0"}]
    //{ connector: echonest, options: { limit: 10 }, apiConfig: { action: "songSearch", in_source: "request.get", in_param: 18 } }
    var transformedConfig = [];
    
    config.sort(function(a,b){
        if(a.order < b.order) return -1;
        if(a.order > b.order) return 1;
        return 0;
    });
    
    $.each(config, function(i,item){
       var routineObject = {};
       routineObject['connector'] = apiMap[item.api];
       routineObject.options = { limit: 5 };
       var in_source;
       if (item.order == 0){
           in_source = "request.get";
       }
       else {
           var prevConnect = transformedConfig[i-1].connector;
           in_source = prevConnect.apiActions[config[i-1].action].out[config[i-1].out]
       }
       routineObject.apiConfig = { action: item.action, in_source: in_source, in_param: item.in_param };
       transformedConfig.push(routineObject);
    });
    
    return transformedConfig;
}

function getChefRecipe(callback){

    request({url: "http://localhost:3000/recipe", headers: { "Accept" : "application/json" }}, function (error, response, result) {
         if (!error && response.statusCode == 200) {
              console.log("REMOTE RECIPE LOADED");                          
              callback(transformChefRecipe(JSON.parse(result)));
         }
         else {
             console.log("REMOTE RECIPE NOT AVAILABLE");
             callback(null);
         }
    });    
}


getChefRecipe(function(config){
    remoteRecipe = config;
});

//http://localhost:4000/switchboard?q=abba
app.get('/switchboard', function(req, res){
    
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })
    
    var sw = [
                 { connector: tmdb, options: { limit: null }, apiConfig: { action: "movieSearch", in_source: "request.get", in_param: 0 } },
                 { connector: tmdb, options: { limit: 2 }, apiConfig: { action: "movieCast", in_source: tmdb.apiActions['movieSearch'].out[0], in_param: 0 } },
                 { connector: spotify, options: { limit: 5 }, apiConfig: { action: "artistSearch", in_source: tmdb.apiActions['movieCast'].out[2], in_param: 0 } }
              ];
                          
    var events = [
                    { connector: spotify, options: { limit: null }, apiConfig: { action: "artistSearch", in_source: "request.get", in_param: 0 } },
                    { connector: lastfm, options: { limit: 3 }, apiConfig: { action: "artistGetEvents", in_source: spotify.apiActions['artistSearch'].out[1], in_param: 0 } },
                    { connector: echonest, options: { limit: 5 }, apiConfig: { action: "artistBiographies", in_source: lastfm.apiActions['artistGetEvents'].out[3], in_param: 1 } },
                 ];
                 
                 
     var bradpitt = [
                  { connector: tmdb, options: { limit: null }, apiConfig: { action: "personSearch", in_source: "request.get", in_param: 0 } }, ////cool if you could split query here and just feed apis "brad pitt"
                  { connector: tmdb, options: { limit: 1 }, apiConfig: { action: "personCredits", in_source: tmdb.apiActions['personSearch'].out[0], in_param: 0 } },
                  { connector: googlebooks, options: { limit: 10 }, apiConfig: { action: "volumesSearch", in_source: tmdb.apiActions['personCredits'].out[2], in_param: 0 } } 
               ];
                 
    var routineConfig = remoteRecipe;
    
    var searchTerm = [req.query.q];
    if(routineConfig == null){
        routineConfig = bradpitt;
    }
    if(searchTerm != null){  
        engine.setRequest(req);
        //engine.setSearch(searchTerm);
        engine.buildRoutine(routineConfig);
        engine.runEngine(function(r,p){
            var c = p;
            res.send(JSON.stringify({ clean: c, raw: r }));
        });
    }

});

app.listen(4000);