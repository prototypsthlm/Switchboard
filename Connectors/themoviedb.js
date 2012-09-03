var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('../keys');

var apiActions = {
    //GET http://api.themoviedb.org/3/search/movie
    "movieSearch" : { action: ['movie','search'], in: ['query'], out: ['results.id', 'results.original_title'], optionals: ['year','language','include_adult','page'] },
    //GET http://api.themoviedb.org/3/movie/11
    "movieLookup" : { action: ['movie','lookup'], in: ['id'], out: ['id', 'imdb_id'], optionals: ['language'] },
    //http://api.themoviedb.org/3/movie/11/casts
    "movieCast" : { action: ['movie','casts'], in: ['id'], out: ['id', 'imdb_id'], optionals: ['language'] },
    
    //"movieSearch" : { action: ['movie','now_playing'], in: [], out: ['results.id', 'results.original_title'], optionals: ['language','page'] }, //how handle?
    
    "personSearch" : { action: ['person','search'], in: ['query'], out: ['results.id', 'results.name'], optionals: ['include_adult','page'] },
    "personLookup" : { action: ['person','lookup'], in: ['id'], out: ['id', 'name', 'birthday', 'place_of_birth'], optionals: ['language'] },
    "personCredits" : { action: ['person','credits'], in: ['id'], out: ['cast.character', 'cast.id', 'cast.original_title'], optionals: ['language'] }
};


function TMDB(param) {
    this.name = "TMDB";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
}

util.inherits(TMDB, BaseConnector);

TMDB.prototype.getActionUrl = function(query, apiConfig){
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];
    var actionPath;
    var parameterObject = {};
    parameterObject['api_key'] = this.apiKey;
    if(action == "search"){
        parameterObject[apiAction.in[apiConfig.in]] = query
        actionPath = action + "/" + domain + "?" + querystring.stringify(parameterObject)
    }
    else if(action == 'lookup') {
        actionPath = domain + "/" + query + "?" + querystring.stringify(parameterObject)
    }
    else {
        actionPath = domain + "/" + query + "/" + action + "?" + querystring.stringify(parameterObject)
    }
    return this.host + actionPath
}

var tmdb = new TMDB({
	host: "http://api.themoviedb.org/3/"
});
module.exports = tmdb;