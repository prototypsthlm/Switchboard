var express = require('express');
var app = express.createServer();
app.use(express.bodyParser());
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');

//var localRecipe = require('./example_routines/starwars_artists.json');
//var localRecipe = require('./example_routines/headliner_biographies.json');
var localRecipe = require('./example_routines/actor_movies_books.json');

var remoteRecipe = null;

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
    var userRecipe = config;
    if(userRecipe == null){
        console.log("LOCAL RECIPE LOADED");
        userRecipe = localRecipe;
    }
    switchboard.setRoutine(userRecipe);
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
        switchboard.setRoutine(routineFromParam);
      }
      catch(e) {
        res.status(500); 
        console.error(e);
      }
    }
    
    if(req.query.q != undefined){  
        switchboard.execute([req.query.q], function(r,c){
            var callback = req.query.callback;
            var jsonString = JSON.stringify({ clean: c, raw: r });
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
        switchboard.setRoutine(req.body.routine);
      }
      catch(e) {
        res.status(500);
        console.error(e);
      }
    }

    if(req.body.q != undefined){  
        switchboard.execute([req.body.q], function(r,c){
            var callback = req.body.callback;
            var jsonString = JSON.stringify({ clean: c, raw: r });
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

app.listen(4000);