var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');

//var localRecipe = require('./example_routines/starwars_artists.json');
//var localRecipe = require('./example_routines/headliner_biographies.json');
var localRoutine = require('./example_routines/actor_movies_books.json');
var remoteRoutine = null;
var liveRoutine = null;

/* loads a JSON-routine from chef */
function loadRemoteRecipe(callback){
    request({url: "http://localhost:3000/recipe", headers: { "Accept" : "application/json" }}, function (error, response, result) {
         if (!error && response.statusCode == 200) {
              console.log("REMOTE RECIPE LOADED");                          
              callback(JSON.parse(result));
         }
         else {
             console.log("REMOTE RECIPE NOT AVAILABLE");
             callback(null);
         }
    }); 
}

/* 
attempts to load remote recipe
if it fails, a local recipe is used instead and is inserted into switchboard
*/
loadRemoteRecipe(function(config){
    liveRoutine = config;
    if(config == null){
        console.log("LOCAL RECIPE LOADED");
        liveRoutine = localRoutine;
    }
    switchboard.setRoutine(liveRoutine);
});


//req.query => get
//req.body => post
//req.param('param', null) => both

/* 
http://localhost:4000/switchboard?q=yourquery 
runs the set switchboard routine with the entry query and outputs the formatted results
*/
app.get('/switchboard', function(req, res){
    res.contentType('json');
    
    console.log("GET REQUEST RECEIVED");
    console.log(req.url);
    console.log(req.query);
    
    if(req.query.routine != undefined) { //take whole filepath instead?
      try {
        var routineFromParam = require('./example_routine/' + req.query.routine + ".json");
        liveRoutine = routineFromParam;
        switchboard.setRoutine(liveRoutine);
      }
      catch(e) {
        res.status(500); 
        console.error(e);
      }
    }
    
    if(req.query.q != undefined){  
        switchboard.execute([req.query.q], function(c, f, r){
            var callback = req.query.callback;
            var jsonString = JSON.stringify({ routine: c, formatted: f, raw: r });
            if(callback) {
                jsonString = callback + "(" + jsonString + ")";
            }
            res.send(jsonString);
        });
    }
    else {
        res.send(JSON.stringify({}));
    }

});

app.post('/switchboard', function(req, res){
    res.contentType('json'); 
    
    console.log("POST REQUEST RECEIVED");
    console.log(req.url);
    console.log(req.body);
    
    if(req.body.routine != undefined) {
      try {
        liveRoutine = req.body.routine;
        switchboard.setRoutine(liveRoutine);
      }
      catch(e) {
        res.status(500);
        console.error(e);
      }
    }

    if(req.body.q != undefined){  
        switchboard.execute([req.body.q], function(c, f, r){
            var jsonString = JSON.stringify({ routine: c, formatted: f, raw: r });
            res.send(jsonString);
        });
    }
    else {
        res.send(JSON.stringify({}));
    }

});

app.listen(4000);