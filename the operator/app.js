var express = require('express')
  , routes = require('./routes')
  , http = require('http');

var app = express();
var fs = require('fs');

var switchboard = require('../index');

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.get('/routine', function(req,res){
    res.contentType('json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With"); 
    
    fs.readFile('./routine.json', 'utf8', function (err,data) {
    if (err) {
        res.send(JSON.stringify({status: err}));
    }
    else{
        res.send(data);
    }
    });
});

app.post('/taste',function(req,res){
    var setup = req.param('data', null);
    var connectors = switchboard.connectors();
    var connector = new connectors.apiMap[setup.api];
    connector.responseObject = [];
    var url = connector.getActionUrl(setup.query,setup.config);
    connector.get(url, setup.query, setup.config, null, null, function(){
        res.send({ response: connector.responseObject, url: url });
    });
    
});

app.post('/set',function(req,res){
    var config = req.param('data', null);
    
    fs.writeFile("routine.json", JSON.stringify(config, null, 4), function(err) {
        if(err) {
            console.log(err);
            res.send("BAD JOB!");
        } else {
            res.send("GREAT JOB!");
        }
    });
});

app.post('/run',function(req,res){
    var data = req.param('data', null);
    switchboard.addAndRunJob(data.routine, [data.q], function(usedRoutine, clean, raw){
        res.send({ routine: usedRoutine, clean: clean, raw: raw });
    });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
