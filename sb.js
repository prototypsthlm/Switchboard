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

var remoteRecipe = "WUT";


function transformChefRecipe(config){
    
    var apiMap = {
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
      return a.order.toLowerCase().localeCompare(b.order.toLowerCase());
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
              callback(transformChefRecipe(JSON.parse(result)));
         }
         else {
             console.log(response.body);
         }
    });    
}


getChefRecipe(function(config){
    remoteRecipe = config;
    console.log("REMOTE RECIPE LOADED");
});

//http://localhost:4000/merge?q=abba
app.get('/switchboard', function(req, res){
    
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })

     //{ connector: echonest, options: { limit: 10 }, apiConfig: { action: "songSearch", in_source: "request.get", in_param: 18 } },
     //{ connector: spotify, options: { limit: 5 }, apiConfig: { action: "artistSearch", in_source: "request.get", in_param: 0 } },
     //{ connector: echonest, options: { limit: 5 }, apiConfig: { action: "artistBiographies", in_source: spotify.apiActions['artistSearch'].out[1], in_param: 1 } },
     //{ connector: googlebooks, options: { limit: 5 }, apiConfig: { action: "volumesSearch", in_source: spotify.apiActions['artistSearch'].out[1], in_param: 0 } },
     //{ connector: tmdb, options: { limit: 5 }, apiConfig: { action: "movieSearch", in_source: spotify.apiActions['artistSearch'].out[1], in_param: 0 } },
    
    var keys =  [
                 { connector: echonest, options: { limit: 10 }, apiConfig: { action: "songSearch", in_source: "request.get", in_param: 18 } },
                 { connector: lastfm, options: { limit: 5 }, apiConfig: { action: "artistGetEvents", in_source: echonest.apiActions['songSearch'].out[2], in_param: 0 } }
                ];
    
    var starWarsArtists = [
                             { connector: tmdb, options: { limit: 2 }, apiConfig: { action: "movieSearch", in_source: "request.get", in_param: 0 } },
                             { connector: tmdb, options: { limit: 5 }, apiConfig: { action: "movieCast", in_source: tmdb.apiActions['movieSearch'].out[0], in_param: 18 } },
                             { connector: spotify, options: { limit: 5 }, apiConfig: { action: "artistSearch", in_source: tmdb.apiActions['movieCast'].out[2], in_param: 0 } }
                            ];
    
    var routineConfig = remoteRecipe;
    
    var searchTerm = [req.query.q];

    if(searchTerm != null){  
        engine.setRequest(req);
        //engine.setSearch(searchTerm);
        engine.buildRoutine(routineConfig);
        engine.runEngine(function(r){
            res.send(JSON.stringify({ results: r }));
        });
    }

});

app.get('/interface', function(req, res){
    //TO:DO
    //LÄSER IN CONNECTORS, TRANSLATION, OCH MÖJLIGA IN/UT
    //BYGGER SEDAN CONFIG SOM PIPAS IN I MERGE
});


app.listen(4000);