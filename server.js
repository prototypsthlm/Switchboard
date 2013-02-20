var express = require("express");
var app = express();
app.use(express.bodyParser());
app.use(express.errorHandler({showStack: true, dumpExceptions: true}));

var request = require('request');
var $ = require('jquery');
var logger = require('./lib/sb_tracer.js')();

var switchboard = require('./index');

//var liveRoutine = require('./example_routines/starwars_artists.json');
//var liveRoutine = require('./example_routines/artist_urls.json');
var liveRoutine = require('./example_routines/actor_movies_books.json');
//var liveRoutine = require('./example_routines/netflix.json');


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

function handleResponse(err, usedRoutine, f, r,  req, res, allowJSONP) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    
    if(err) {
        logger.error(err);
        res.send(500, { error: err.stack });
        return;
    }          
    
    var jsonString = JSON.stringify({ routine: usedRoutine, formatted: f, raw: r });

    if(allowJSONP) {
        var callback = req.query.callback;
        if(callback)
            jsonString = callback + "(" + jsonString + ")";
    }

    res.send(jsonString);
    

}

function handleRequest(httpMethod, req, res) {
    
    try {
       // Only POST and GET requests are allowed
       if(!(httpMethod == "POST" || httpMethod == "GET")) {
           logger.warn('HTTP-method not POST or GET. Method: ' + httpMethod);
           res.send(JSON.stringify({}));
           return;
       }

       // Use routine if sent in the request
       if(req.param('routine') != undefined) {
           if(httpMethod == "GET")
               liveRoutine = JSON.parse(req.param('routine'));
           else
               liveRoutine = req.param('routine') instanceof Array ? req.param('routine') : JSON.parse(req.param('routine')); // Whole routine is posted as json (form data or raw)
       } else if(req.param('example_routine')) {
          liveRoutine = require('./example_routines/'+ req.param('example_routine') +'.json');          
       }

       logger.debug("Running Routine: ", JSON.stringify(liveRoutine, null, 4));

       var jobId = switchboard.addJob(liveRoutine, req.param('q'));
       
       var allowJSONP = httpMethod == "GET";
       
       switchboard.runJob(jobId, function(err, usedRoutine, formatted, raw) { handleResponse(err, usedRoutine, formatted, raw, req, res, allowJSONP); });
       
    }
    catch(e) {
        throw(e); // return instead?
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
app.get('/switchboard', function(req, res, next){
    res.contentType('json');
    
    logger.info("GET request received");
    logger.debug(req.url);
    logger.debug(req.query);
    
    try {
        handleRequest("GET", req, res);
    }
    catch(e) {
        logger.error(e);
        res.send(500, { error: e.stack });
    }
 
});

app.post('/switchboard', function(req, res){
    res.contentType('json'); 
    
    logger.info("POST request received");
    logger.debug(req.url);
    logger.debug(req.body);
    
    try {
        handleRequest("POST", req, res);
    }
    catch(e) {
        logger.error(e);
        res.send(500, { error: e.stack });
    }
    
});

var port = 4000;
app.listen(port);
logger.info('Switchboard listening on port', port);
