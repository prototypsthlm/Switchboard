var Spotify = require('./base_connector.js');
var async = require("async");

var spotify = new Spotify({
	host: "http://ws.spotify.com"
});

Spotify.prototype.execute = function(queries, domain, cb) {
    
    var base = this.host + "/search/1/"+domain+".json?q=";
    
    async.forEach(queries, function lookup(query, done) {
        var url = base + encodeURI(query);
        console.log('preparing request to ' + url);
        this.get(url, done); 
    },
    function(err){
        cb(this.responseObject);
    });
}

module.exports = spotify;

