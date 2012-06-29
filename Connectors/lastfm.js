var request = require('request');

var event_search = function(q, cb) { //paging...&page=2....
    
    var base = "http://ws.audioscrobbler.com/2.0/?method=artist.getevents&format=json&artist="
    var key = "&api_key=570d0b659de5f43d6053e0abdb80c643"
    
    lurl = base + encodeURI(q) + key; 
    
    console.log("-------------------------------------------------------------------------------");
    console.log("-------------------------------------------------------------------------------");
    console.log("-------------------------------------------------------------------------------");
    console.log('preparing request to ' + lurl);
    
    request(lurl, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        //console.log(result);
        cb(result)
      }
    });
};


exports.lookup = function(q, cb){
    event_search(q,cb);
}