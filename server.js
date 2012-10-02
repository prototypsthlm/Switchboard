var express = require("express");
var app = express();
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');
//var recipeToLoad = require('./example_routines/headliner_biographies.json');
var recipeToLoad = require('./example_routines/starwars_artists.json');

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
    if(config != null) {
      recipeToLoad = config;
    } 
});

/* 
http://localhost:4000/switchboard?q=yourquery 
runs the set switchboard routine with the entry query and outputs the formatted results
*/
app.get('/switchboard', function(req, res){
    
    function jobFinished(r, c) {
      var callback = req.query.callback;
      var jsonString = JSON.stringify({ clean: c, raw: r });
      if(callback) {
          jsonString = callback + "(" + jsonString + ")";
      }
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.send(jsonString);
    }

    console.log("REQUEST RECEIVED");
    console.log(req.url);
    
    res.contentType('json');
                 
    var searchTerm = [req.query.q];

    if(searchTerm != null){  
      console.log("recipeToLoad",  recipeToLoad);
      console.log("switchboard ", switchboard);

      var jobId = switchboard.addJob(recipeToLoad, req);
      switchboard.runJob(jobId, jobFinished);
      /*
      switchboard.execute(recipeToLoad, req, function(r,c){
            
          });
      */
      /*
        switchboard.execute(req, function(r,c){
            var callback = req.query.callback;
            var jsonString = JSON.stringify({ clean: c, raw: r });
            if(callback) {
                jsonString = callback + "(" + jsonString + ")";
            }
            res.set('Content-Type', 'application/json; charset=utf-8');
            res.send(jsonString);
        });
*/
    }

});

app.listen(4000);