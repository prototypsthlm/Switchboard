var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');

/*Spotify.prototype = new BaseConnector({
	host: "http://ws.spotify.com"
});*/

function Spotify(param) {
    this.name = "Spotify";
	this.host = param.host;
	this.responseObject = [];
}

var apiActions = { 
    'search.album' : ['q','page'],
    'search.artist' : ['q','page'],
    'search.track' : ['q', 'page'],
    'lookup.album' : ['uri','extras'],// extras => track, trackdetail
    'lookup.artist' : ['uri','extras'],// extras => album, albumdetail
    'lookup.track' : ['uri','extras']
}

util.inherits(Spotify, BaseConnector);

Spotify.prototype.getActionUrl = function(query, api_domain){
    var actionBreakdown = api_domain.split(".");
    var baseAction = actionBreakdown.shift();
    var search_domain = actionBreakdown.shift();
    var actionPath;
    switch(baseAction)
    {
    case 'search':
      actionPath = '/search/1/'+search_domain+'.json?'+querystring.stringify({q: query})
      break;
    case 'lookup':
      var extra;
      if(search_domain == 'album'){
          extra = 'trackdetail'
      }
      else if(search_domain == 'artist'){
          extra = 'albumdetail'
      }
      actionPath = '/lookup/1/.json?'+querystring.stringify({uri: query, extras: extra }) //extras: search_domain
      break;
    }      
    return this.host + actionPath
}

var spotify = new Spotify({
	host: "http://ws.spotify.com"
});

module.exports = spotify;

