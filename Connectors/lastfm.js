
var Lastfm = require('./base_connector.js');
var async = require("async");

var lastfm = new Lastfm({
	host: "http://ws.audioscrobbler.com"
});

Lastfm.prototype.execute = function(queries, domain, cb) {
    
    var base = this.host + "/2.0/?method=artist.getevents&format=json&artist="
    var key = "&api_key=570d0b659de5f43d6053e0abdb80c643"
    
    async.forEach(queries, function lookup(query, done) {
        var url = base + encodeURI(query) + key;
        console.log('preparing request to ' + url);
        this.get(url, done); 
    },
    function(err){
        cb(this.responseObject);
    });
}

module.exports = lastfm;
