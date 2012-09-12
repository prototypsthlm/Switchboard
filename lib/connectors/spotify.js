var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');

/*Spotify.prototype = new BaseConnector({
	host: "http://ws.spotify.com"
});*/

var apiActions = {
    "artistSearch" : { action: ['search','artist'], in_param: ['q'], out: ['artists.href','artists.name'], optionals: ['page'] },
    "albumSearch" : { action: ['search','album'], in_param: ['q'], out: ['albums.href','albums.name','albums.artists.href','albums.artists.name'], optionals: ['page'] },
    "trackSearch" : { action: ['search','track'], in_param: ['q'], out: ['tracks.href','tracks.name','tracks.album.name','tracks.album.href','tracks.artists.href','tracks.artists.name'], optionals: ['page'] },
    "artistLookup" : { action: ['lookup','artist'], in_param: ['uri'], out: ['artist.albums.album.name','artist.albums.album.href'], statics: [ { paramName : "extras", paramValue: 'albumdetail'} ] },
    "albumLookup" : { action: ['lookup','album'], in_param: ['uri'], out: ['album.name','album.tracks.href','album.tracks.name'], statics: [ { paramName : "extras", paramValue: 'trackdetail'} ] },
    "trackLookup" : { action: ['lookup','track'], in_param: ['uri'], out: ['track.href','track.name','track.album.name','track.album.href'] }
};

function Spotify(param) {
    this.name = "Spotify";
	this.host = param.host;
	this.responseObject = [];
	this.apiActions = apiActions;
}
util.inherits(Spotify, BaseConnector);

Spotify.prototype.getActionUrl = function(query, apiConfig){

    var apiAction = apiActions[apiConfig.action];
    var baseAction = apiAction.action[0];
    var searchDomain = apiAction.action[1];
    var actionPath;
    var parameterObject = {};
    parameterObject[apiAction.in_param[apiConfig.in_param]] = query;        
    
    switch(baseAction)
    {
    case 'search':
        actionPath = '/search/1/'+searchDomain+'.json?'
        break;
    case 'lookup':
        parameterObject[apiAction.statics.paramName] = apiAction.statics[apiAction.statics.paramValue];        
        actionPath = '/lookup/1/.json?'
        break;
    }      
    return this.host + actionPath + querystring.stringify(parameterObject);
}

var spotify = new Spotify({
	host: "http://ws.spotify.com"
});

module.exports = spotify;

