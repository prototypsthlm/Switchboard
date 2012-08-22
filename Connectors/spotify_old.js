var request = require('request');
var async = require("async");
var $ = require('jquery');

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
            //cb(spotify.handle_artists(result));
            cb(result);
          }
          done();
        });
    });
    

};

var api_search = function(q, cat, cb) { //paging...&page=2....
    
    var base = "http://ws.spotify.com/search/1/"+cat+".json?q=";
    var responseObject = new Array();
    console.log(q);
    async.forEach(q, function lookup(query, done) {
        var lurl = base + encodeURI(query);
        var queryResult = new Array();
        console.log('preparing request to ' + lurl);
        request(lurl, function (error, response, result) {
          if (!error && response.statusCode == 200) {
            console.log("returned result");
            responseObject.push({key: cat, value: query, result: JSON.parse(result)});
          }
          done();
        });
    },function(err){
        cb(responseObject);
    });
};






exports.handle_results = function(domain, key, result){ //handle_artists?
    console.log("artists lookup complete");
    var returnObject = new Array();
    var limit = 5;
    var items = new Array();
    $.each(result[0].result[domain], function(i, val) {
        if(i >= limit) return false;
        items.push(val[key]);
    });
    console.log(items);
    return items;
};

exports.lookup = function(q, cb){
    api_lookup(q,cb);
}
exports.artists = function(q, cb) {
    console.log("artists ")
    console.log(q);
    api_search(q,"artist",cb);
};

exports.tracks = function(q, cb) {
    api_search(q,"track",cb);
};

exports.albums = function(q, cb) {
    api_search(q,"album",cb);
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