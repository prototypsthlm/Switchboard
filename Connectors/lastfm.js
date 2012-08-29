var util = require('util');
var BaseConnector = require('./base_connector.js');
var async = require("async");

function Lastfm(param) {
	this.host = param.host;
	this.responseObject = [];
}

util.inherits(Lastfm, BaseConnector);

Lastfm.prototype.execute = function(queries, domain, cb) {
    console.log("LASTFM EXECUTE");
    var self = this;
    self.responseObject = [];
    
    var base = this.host + "/2.0/?method=artist.getevents&format=json&artist="
    var key = "&api_key=570d0b659de5f43d6053e0abdb80c643"
    async.forEach(queries, function lookup(query, done) {
        var url = base + encodeURI(query) + key;
        console.log('preparing request to ' + url);
        self.get(url, query, domain, done); 
    },
    function(err){
        cb(self.responseObject);
    });
}

var lastfm = new Lastfm({
	host: "http://ws.audioscrobbler.com"
});

module.exports = lastfm;
