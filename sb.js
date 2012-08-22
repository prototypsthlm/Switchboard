var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var express = require('express');
var async = require("async");
var $ = require('jquery');
var app = express.createServer();
var engine = require('./engine.js');


//http://localhost:4000/merge?q=abba
app.get('/merge', function(req, res){
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })
    //var translatedConfig = [{ routine: spotify.artists, limit: 5, api_domain: "artists", key: "name"}, { routine: lastfm.lookup, limit: 5, key: "name"}]
    //translation.spotify['artist'] = "artists-url-bit"
    var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "artist", query_source: "request.get" }, { connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "result.artists.name" }]
    
    var file_config = [];
    var searchTerm = [req.query.q];
    //var config = [{ routine: lastfm.lookup, limit: 5, nyckla: "name"}]
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