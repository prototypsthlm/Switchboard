var spotify = require('./Connectors/spotify.js');
var lastfm = require('./Connectors/lastfm.js');
var express = require('express');
var async = require("async");
var $ = require('jquery');
var app = express.createServer();

/*app.get('/', function(req, res){
    //res.writeHead(200, {'content-type' : 'application/jsonstream'});
    
    //res.json(spotify.search("abba"));
    //res.writeHead(200, { 'Content-Type': 'application/json' });
    res.contentType('json');
    //spotify.artists("album", function(result){
        //res.send(JSON.parse(result));
    //});
    
    spotify.lookup("spotify:artist:02uPe16VFxPaiueQsPEDkE",function(result){
        res.send(JSON.parse(result));
    });
    //console.log(sjson);
    //var gotJ = JSON.parse(spotify.search("abba"));
    //res.write(spotify.search("abba"));
    //res.end();
});


app.get('/artists', function(req, res){

    res.contentType('json');
    console.log(req.query.q);
    
    spotify.artists(req.query.q, function(result){
        res.send(JSON.parse(result));
    });

});*/

//http://localhost:4000/merge?q=abba
app.get('/merge', function(req, res){
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/json' })
    
    var file_config = [];
    var search_term = [req.query.q];
    var translated_config = [{ routine: spotify.artists, limit: 5, nyckla: "name"}, { routine: lastfm.lookup, limit: 5, nyckla: "name"}]
    //var config = [{ routine: lastfm.lookup, limit: 5, nyckla: "name"}]
    
    var routine = new Array();
    
    $.each(translated_config, function(i,a){
        var r;
        if(i < 1){
            r = function(callback){
                translated_config[i].routine(search_term, function(results){
                    console.log("routine" + i + " complete");
                    callback(null, results); //skickar vidare items till nästa funktion i waterfall
                });
            };
        }
        else {
            r = function(received, callback){
                translated_config[i].routine(received[0][0].result, function(results){
                    console.log("routine" + i + " complete");
                    callback(null, results); //skickar vidare items till nästa funktion i waterfall
                });
            };
        }
        routine.push(r);
    });

    async.waterfall(routine, function (err, result) {
       console.log("END");
       res.send(JSON.stringify({ results: result }));    
    });
    

});

app.listen(4000);

/*app.get('', function(req, res) {
  console.log("GETTING CONTACTS");
  var fields = {};
  if (req.query.fields) {
    try {
      fields = JSON.parse(req.query.fields);
    } catch(E) {}
  }
  dataStore.getAll(fields, function(err, cursor) {
    if(!req.query.all) cursor.limit(20); // default 20 unless all is set
    if(req.query.limit) cursor.limit(parseInt(req.query.limit));
    if(req.query.offset) cursor.skip(parseInt(req.query.offset));
    if(req.query.stream == 'true') {
      res.writeHead(200, {'content-type' : 'application/jsonstream'});
      cursor.each(function(err, object){
        if (err) logger.error(err); // only useful here for logging really
        if (!object) return res.end();
        res.write(JSON.stringify(object)+'\n');
      });
    } else {
      cursor.toArray(function(err, items) {
        res.send(items);
      });
    }
  });
});*/