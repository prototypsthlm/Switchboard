var request = require('request');

var api_search = function(q, cat, cb) { //paging...&page=2....
    
    var base = "http://ws.spotify.com/search/1/"+cat+".json?q=";
    lurl = base + encodeURI(q); 
    console.log('preparing request to ' + lurl);
    
    request(lurl, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        cb(result)
      }
    });
};

var api_lookup = function(q, cb) { //paging...&page=2....
    
    var base = "http://ws.spotify.com/lookup/1/.json?uri=";
    var b = "&extras=album";
    var d = "&extras=albumdetail";
    lurl = base + q + b; 
    console.log('preparing request to ' + lurl);
    
    request(lurl, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        console.log("returned result");
        //console.log(result);
        cb(result)
      }
    });
};

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