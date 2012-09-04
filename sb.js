var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var echonest = require('./Connectors/echonest.js');
var googlebooks = require('./Connectors/googlebooks.js');
var tmdb = require('./Connectors/themoviedb.js');

var express = require('express');
var app = express.createServer();
var engine = require('./engine.js');


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
    
    var routineConfig = starWarsArtists;
    
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