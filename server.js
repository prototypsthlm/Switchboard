var express = require("express");
var app = express();
app.use(express.bodyParser());
var request = require('request');
var $ = require('jquery');

var switchboard = require('./index');

var liveRoutine = require('./example_routines/starwars_artists.json');
//var liveRoutine = require('./example_routines/headliner_biographies.json');
//var liveRoutine = require('./example_routines/actor_movies_books.json');

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

function handleResponse(usedRoutine, c, r,  req, res, allowJSONP) {
  var jsonString = JSON.stringify({ routine: usedRoutine, clean: c, raw: r });

  if(allowJSONP) {
    var callback = req.query.callback;
    
    if(callback) {
        jsonString = callback + "(" + jsonString + ")";
    }
  }

  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send(jsonString);
}


//req.query => get
//req.body => post
//req.param('param', null) => both
function handleRequest(httpMethod, req, res) {

  // Only POST and GET requests are allowed
  if(!(httpMethod == "post" || httpMethod == "get")) {
    res.send(JSON.stringify({}));
    return;
  }

  // Use recipe if sent in the request
  if(req.param('routine') != undefined) {
      try {
        if(httpMethod == "get") {
          liveRoutine = require('./example_routines/' + req.param('routine') + ".json");         
        }
        else {
          liveRoutine = req.param('routine'); // Whole recipe is posted as json
        }
      }
      catch(e) {
        res.status(500);
        console.error(e);
      }
    }

    console.log("RECIPE ", liveRoutine);

    if(req.param('q') != undefined){
        var jobId = switchboard.addJob(liveRoutine, [req.param('q')]); //switchboard.setRoutine(liveRoutine);
        var allowJSONP = httpMethod == "get";
        switchboard.runJob(jobId, function(usedRoutine, clean, raw) { handleResponse(usedRoutine, clean, raw, req, res, allowJSONP); });
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
    if(config != null){
        console.log("REMOTE RECIPE LOADED");
        liveRoutine = config;
    }
});

/* 
http://localhost:4000/switchboard?q=yourquery 
runs the set switchboard routine with the entry query and outputs the formatted results
*/
app.get('/switchboard', function(req, res){
    res.contentType('json');
    
    console.log("GET REQUEST RECEIVED");
    console.log(req.url);
    console.log(req.query);
    
    handleRequest("get", req, res);
 
});

app.post('/switchboard', function(req, res){
    res.contentType('json'); 
    
    console.log("POST REQUEST RECEIVED");
    console.log(req.url);
    console.log(req.body);
    
    handleRequest("post", req, res);
    
});

app.listen(4000);