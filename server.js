var express = require("express");
var app = express();
app.use(express.bodyParser());
var request = require('request');
var $ = require('jquery');
var logger = require('./lib/sb_tracer.js')();

var switchboard = require('./index');

var liveRoutine = require('./example_routines/starwars_artists.json');
//var liveRoutine = require('./example_routines/headliner_biographies.json');
//var liveRoutine = require('./example_routines/actor_movies_books.json');

/* Loads a JSON-routine from the operator */
function loadRemoteRoutine(callback){
    request({url: "http://localhost:3000/routine", headers: { "Accept" : "application/json" }}, function (error, response, result) {
         if (!error && response.statusCode == 200) {
              callback(JSON.parse(result));
         }
         else {
             callback(null);
         }
    }); 
}

function handleResponse(usedRoutine, f, r,  req, res, allowJSONP) {
  var jsonString = JSON.stringify({ routine: usedRoutine, formatted: f, raw: r });

  if(allowJSONP) {
    var callback = req.query.callback;
    
    if(callback) {
        jsonString = callback + "(" + jsonString + ")";
    }
  }

  res.set('Content-Type', 'application/json; charset=utf-8');
  res.send(jsonString);
}

function handleRequest(httpMethod, req, res) {

  // Only POST and GET requests are allowed
  if(!(httpMethod == "POST" || httpMethod == "GET")) {
    logger.warn('HTTP-method not POST or GET. Method: ' + httpMethod);
    res.send(JSON.stringify({}));
    return;
  }

  // Use routine if sent in the request
  if(req.param('routine') != undefined) {
      try {
        if(httpMethod == "GET") {
          liveRoutine = require('./example_routines/' + req.param('routine') + ".json");         
        }
        else {
          liveRoutine = JSON.parse(req.param('routine')); // Whole routine is posted as json
        }
      }
      catch(e) {
        res.status(500);
        logger.error(e);
      }
    }

    logger.trace("Live Routine: ", JSON.stringify(liveRoutine, null, 4));

    if(req.param('q') != undefined){
        var jobId = switchboard.addJob(liveRoutine, [req.param('q')]);
        var allowJSONP = httpMethod == "GET";
        switchboard.runJob(jobId, function(usedRoutine, formatted, raw) { handleResponse(usedRoutine, formatted, raw, req, res, allowJSONP); });
    }
    else {
        res.send(JSON.stringify({}));
    }

}

/* 
Attempts to load a remote routine
If it fails, a local routine is used instead and is inserted into Switchboard.
*/
loadRemoteRoutine(function(routine){
    if(routine != null){
        logger.info("Remote routine loaded from the operator.");                          
        liveRoutine = routine;
    }
});

/* 
http://localhost:4000/switchboard?q=yourquery 
Runs the set switchboard routine with the entry query and outputs the formatted results
*/
app.get('/switchboard', function(req, res){
    res.contentType('json');
    
    logger.debug("GET request received");
    logger.trace(req.url);
    logger.trace(req.query);
    
    handleRequest("GET", req, res);
 
});

app.post('/switchboard', function(req, res){
    res.contentType('json'); 
    
    logger.debug("POST request received");
    logger.trace(req.url);
    logger.trace(req.body);
    
    handleRequest("POST", req, res);
    
});

var port = 4000;
app.listen(port);
logger.info('Switchboard listening on port', port);
