var request = require('request');
var async = require("async");
var $ = require('jquery');

var api_search = function(q, cat, cb) { //paging...&page=2....
    
    var base = "http://ws.spotify.com/search/1/"+cat+".json?q=";
    var response_object = new Array();
    async.forEach(q, function lookup(item, done) {
        var lurl = base + encodeURI(item);
        var pairing = new Array();
        console.log('preparing request to ' + lurl);
        request(lurl, function (error, response, result) {
          if (!error && response.statusCode == 200) {
            console.log("returned result");
            //console.log(result);
            pairing.push({q: item, result: handle_artists(result)});
            response_object.push(pairing);
          }
          done();
        });
    },function(err){
        cb(response_object);
    });
};

var api_lookup = function(q, cb) { //paging...&page=2....
    
    var base = "http://ws.spotify.com/lookup/1/.json?uri=";
    var b = "&extras=album";
    var d = "&extras=albumdetail";

    async.forEach(q, function lookup(item, done) {
        var lurl = base + item + b; 
        console.log('preparing request to ' + lurl);
        request(lurl, function (error, response, result) {
          if (!error && response.statusCode == 200) {
            console.log("returned result");
            //console.log(result);
            cb(spotify.handle_artists(result));
          }
          done();
        });
    });
    

};

//http://ws.spotify.com/search/1/artist.json?q=foo
var handle_artists = function(result){ //handle_artists?
    console.log("artists lookup complete");
    var returnObject = new Array();
    var limit = 5;
    var items = new Array();
    $.each(JSON.parse(result)['artists'], function(i, val) {
        if(i >= limit) return false;
        items.push(val['name']);
    });
    console.log(items);
    return items;
}

exports.lookup = function(q, cb){
    api_lookup(q,cb);
}
exports.artists = function(q, cb) {
    console.log("artists ")
    api_search(q,"artist",cb);
};

exports.tracks = function(q, cb) {
    api_search(q,"track",cb);
};

exports.albums = function(q, cb) {
    api_search(q,"album",cb);
};