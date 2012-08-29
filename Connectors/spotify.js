var util = require('util');
var BaseConnector = require('./base_connector.js');
var async = require("async");

/*Spotify.prototype = new BaseConnector({
	host: "http://ws.spotify.com"
});*/

function Spotify(param) {
	this.host = param.host;
	this.responseObject = [];
}

/*var spotifySpec = { 
    'search.album' : [],
    'search.artist' : [],
    'search.track' : [],
    'lookup.uri' : ''
    
}*/

util.inherits(Spotify, BaseConnector);

Spotify.prototype.execute = function(queries, domain, cb) {
    //not yet implemented: paging
    
    console.log("SPOTIFY EXECUTE");
    
    var self = this;
    self.responseObject = [];
    
    var base = this.host + "/search/1/"+domain+".json?q=";
    
    async.forEach(queries, function lookup(query, done) {
        var url = base + encodeURI(query);
        console.log('preparing request to ' + url);
        self.get(url, query, domain, done);
    },
    function(err){
        cb(self.responseObject);
    });
}

var spotify = new Spotify({
	host: "http://ws.spotify.com"
});

module.exports = spotify;

