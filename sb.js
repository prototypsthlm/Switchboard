var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var express = require('express');
var app = express.createServer();
var engine = require('./engine.js');

//http://localhost:4000/merge?q=abba
app.get('/merge', function(req, res){
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })

    //translation.spotify['artist'] = "artists-url-bit"
    //var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "artist", query_source: "request.get" }, { connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "result.artists.name" }]
    //var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "artist", query_source: "result.events.event.venue.name" }]
    var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "artist", query_source: "result.events.event.artists.artist" }]
    
    var file_config = [];
    var searchTerm = [req.query.q];

    if(searchTerm != null){  
        engine.setRequest(req);
        //engine.setSearch(searchTerm);
        engine.buildRoutine(translatedConfig);
        engine.runEngine(function(r){
            res.send(JSON.stringify({ results: r }));
        });
    }

});

app.listen(4000);