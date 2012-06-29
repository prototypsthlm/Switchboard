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

app.get('/merge/:query', function(req, res){

    res.contentType('json');
    //res.writeHead(200, { 'Content-Type': 'application/jsons' })
    spotify.artists(req.params.query, function(result){
        
        console.log("init baby");
        var returnObject = new Array();
        var limit = 5;
            
        var a = new Array();
        
        $.each(JSON.parse(result)['artists'], function(i, val) {
            if(i > limit) return false;
            a.push(val['name']);
        });
        
        var r = new Array();
        async.forEach(a, function lookup(item, callback) {

          lastfm.lookup(item, function(lastfmresult){
              
              console.log("lookup complete");
              var obj = new Array();
              var p = JSON.parse(lastfmresult)['events'];
              if(p['event']){
                  
                  $.each(p['event'], function(j, v) {
                       //console.log('event: ');
                       //console.log(v['title']);
                       //obj.push(JSON.stringify({ name: item, events: obj });
                       obj.push(v);
                     });
              }
              r.push({name: item, events: obj});
              //res.write(JSON.stringify({ name: item, events: obj }));
              callback();
          });
          console.log(item);
          
        }, function(err){
            console.log("sending result");
            res.send(JSON.stringify({ results: r }));
          // if any of the saves produced an error, err would equal that error
        });
        //if(i > limit) return false;
        
    });

});

app.listen(3000);

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