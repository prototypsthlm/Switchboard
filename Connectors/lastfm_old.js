var request = require('request');
var async = require("async");
var $ = require('jquery');

var event_search = function(q, cb) { //paging...&page=2....
    
    var base = "http://ws.audioscrobbler.com/2.0/?method=artist.getevents&format=json&artist="
    var key = "&api_key=570d0b659de5f43d6053e0abdb80c643"
    var response_object = new Array();
    
    async.forEach(q, function lookup(item, done) {
        var lurl = base + encodeURI(item) + key; 
        console.log('preparing request to ' + lurl);
        
        var pairing = new Array();
        
        request(lurl, function (error, response, result) {
          if (!error && response.statusCode == 200) {
            //console.log(result);
            pairing.push({q: item, result: handle_events(result)});
            response_object.push(pairing);
          }
          done();
        });
        
    }, function(err){
        cb(response_object);
    });
};

//http://ws.audioscrobbler.com/2.0/?method=artist.getevents&format=json&artist=Abba&api_key=570d0b659de5f43d6053e0abdb80c643
var handle_events = function(lastfmresult){
       var obj = new Array();
       var p = JSON.parse(lastfmresult)['events'];
       //console.log(lastfmresult);
       if(p && p['event']){
           $.each(p['event'], function(j, v) { //all events for artist
                obj.push(v);
           });
       }
       return obj;
};

exports.lookup = function(q, cb){
    event_search(q,cb);
}