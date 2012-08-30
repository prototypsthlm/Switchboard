var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var echonest = require('./Connectors/echonest.js');

var express = require('express');
var app = express.createServer();
var engine = require('./engine.js');

//http://localhost:4000/merge?q=abba
app.get('/switchboard', function(req, res){
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })

    //translation.spotify['artist'] = "artists-url-bit"
    //var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "search.artist", query_source: "request.get" }, { connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "result.artists.name" }]
    //var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "artist", query_source: "result.events.event.venue.name" }]
    //var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "artist.event", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "search.artist", query_source: "result.events.event.artists.artist" }]
    //var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "search.artist", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "lookup.artist", query_source: "result.artists.href" }]
    //var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "artist.getEvents", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "search.artist", query_source: "result.events.event.artists.artist" }, { connector: spotify, options: { limit: 2 }, api_domain: "lookup.artist", query_source: "result.artists.href" }]
    //var translatedConfig = [{ connector: lastfm, options: { limit: 5 }, api_domain: "chart.gethypedartists", query_source: "request.get" }, { connector: spotify, options: { limit: 2 }, api_domain: "search.artist", query_source: "result.artists.artist.name" }, { connector: spotify, options: { limit: 2 }, api_domain: "lookup.artist", query_source: "result.artists.href" }]
    
    //var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "search.artist", query_source: "request.get" }, { connector: lastfm, options: { limit: 5 }, api_domain: "artist.getsimilar", query_source: "result.artists.name" }]   
    //var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "search.artist", query_source: "request.get" }, { connector: echonest, options: { limit: 5 }, api_domain: "artist.blogs.name", query_source: "result.artists.name" }]   
    var translatedConfig = [{ connector: spotify, options: { limit: 5 }, api_domain: "search.artist", query_source: "request.get" }, { connector: echonest, options: { limit: 5 }, api_domain: "artist.blogs.name", query_source: "result.artists.name" }]   
    
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

app.get('/interface', function(req, res){
    //TO:DO
    //LÄSER IN CONNECTORS, TRANSLATION, OCH MÖJLIGA IN/UT
    //BYGGER SEDAN CONFIG SOM PIPAS IN I MERGE
});


app.listen(4000);