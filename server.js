var express = require('express');
var app = express.createServer();
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');

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
        userRecipe = localRecipe;
    }
    switchboard.setRoutine(userRecipe);
});

/* 
http://localhost:4000/switchboard?q=yourquery 
runs the set switchboard routine with the entry query and outputs the formatted results
*/
app.get('/switchboard', function(req, res){
    
    console.log("REQUEST RECEIVED");
    console.log(req.url);
    
    res.contentType('json');
                 
    var searchTerm = [req.query.q];

    if(searchTerm != null){  
        switchboard.execute(req, function(r,c){
            res.send(JSON.stringify({ clean: c, raw: r }));
        });
    }

});

app.listen(4000);