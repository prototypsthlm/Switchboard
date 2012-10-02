var express = require("express");
var app = express();
app.use(express.bodyParser());
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');

//var recipeToLoad = require('./example_routines/starwars_artists.json');
//var recipeToLoad = require('./example_routines/headliner_biographies.json');
var recipeToLoad = require('./example_routines/actor_movies_books.json');

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

function handleResponse(r, c, req, res, allowJSONP) {
  var jsonString = JSON.stringify({ clean: c, raw: r });

  if(allowJSONP) {
    var callback = req.query.callback;
    
    if(callback) {
        jsonString = callback + "(" + jsonString + ")";
    }
  }

  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send(jsonString);
}

function handleRequest(httpMethod, req, res, recipe) {
  // Only POST and GET requests are allowed
  if(!(httpMethod == "post" || httpMethod == "get")) {
    res.send(JSON.stringify({}));
    return;
  }

  var requestKey = httpMethod == "get" ? 'query' : 'post';

  // Use recipe if sent in the request
  if(req[requestKey].routine != undefined) {
      try {
        if(httpMethod == "get") {
          recipe = require('./example_routines/' + req.query.routine + ".json");         

        }
        else {
          // Whole recipe is posted as json
          recipe = req.body.routine; 
        }
        
        
      }
      catch(e) {
        res.status(500);
        console.error(e);
      }
    }

    console.log("RECIPE ", recipe)

    if(req[requestKey].q != undefined){
        var jobId = switchboard.addJob(recipe, [req[requestKey].q]);
        var allowJSONP = httpMethod == "get";
        switchboard.runJob(jobId, function(r, c) { handleResponse(r, c, req, res, allowJSONP); });
    }
    else {
        res.send(JSON.stringify({}));
    }

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
    handleRequest("get", req, res, recipeToLoad);
    /*
    if(req.query.routine != undefined) { //take whole filepath instead?
      try {
        recipeToLoad = require('./example_routine/' + req.query.routine + ".json");        
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
    */
});

app.post('/switchboard', function(req, res){
    res.contentType('json'); 
    
    console.log("POST REQUEST RECEIVED");
    console.log(req.url);
    console.log(req.body);
    handleRequest("post", req, res, recipeToLoad);
    /*
    if(req.body.routine != undefined) {
      try {
        recipeToLoad = req.body.routine;        
      }
      catch(e) {
        res.status(500);
        console.error(e);
      }
    }

    if(req.body.q != undefined){  
        switchboard.execute([req.body.q], function(r,c){
            var jsonString = JSON.stringify({ clean: c, raw: r });
            res.send(jsonString);
        });
    }
    else {
        res.send(JSON.stringify({}));
    }
*/
});

app.listen(4000);