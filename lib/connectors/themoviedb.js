var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var apiActions = {
    //GET http://api.themoviedb.org/3/search/movie
    "movieSearch" : { action: ['movie','search'], in_param: ['query'], out: ['results.id', 'results.original_title'], optionals: ['year','language','include_adult','page'] },
    //GET http://api.themoviedb.org/3/movie/11
    "movieLookup" : { action: ['movie','lookup'], in_param: ['id'], out: ['id', 'imdb_id', 'belongs_to_collection.id', 'belongs_to_collection.name', 'genres.id', 
        'genres.name','production_companies.id','production_companies.name','production_countries.iso_3166_1','production_countries.name', 'tagline'], optionals: ['language'] }, //note that things in array...works still?
    //http://api.themoviedb.org/3/movie/11/casts
    "movieCast" : { action: ['movie','casts'], in_param: ['id'], out: ['cast.id', 'cast.name','cast.character'], optionals: ['language'] },
    
    "movieAltTitles" : { action: ['movie','alternative_titles'], in_param: ['id'], out: ['id', 'titles.iso_3166_1','titles.title'], optionals: ['country'] },
    "movieImages" : { action: ['movie','images'], in_param: ['id'], out: [], optionals: ['language'] },
    "movieKeywords" : { action: ['movie','keywords'], in_param: ['id'], out: ['id','keywords.id','keywords.name'], optionals: ['language'] },
    "movieReleases" : { action: ['movie','releases'], in_param: ['id'], out: ['countries.release_date'], optionals: [] },
    "movieTrailers" : { action: ['movie','trailers'], in_param: ['id'], out: [], optionals: ['language'] },
    "movieTranslations" : { action: ['movie','translations'], in_param: ['id'], out: [], optionals: ['language'] },
    "similarMovies" : { action: ['movie','similar_movies'], in_param: ['id'], out: ['results.id', 'results.title', 'results.original_title'], optionals: ['page','language'] },
    
    "genreMovies" : { action: ['genre','movies'], in_param: ['id'], out: ['results.id', 'results.title', 'results.original_title'], optionals: ['page','language'] },
    
    "personSearch" : { action: ['person','search'], in_param: ['query'], out: ['results.id', 'results.name'], optionals: ['include_adult','page'] },
    "personLookup" : { action: ['person','lookup'], in_param: ['id'], out: ['id', 'name', 'birthday', 'place_of_birth'], optionals: ['language'] },
    "personCredits" : { action: ['person','credits'], in_param: ['id'], out: ['cast.character', 'cast.id', 'cast.original_title'], optionals: ['language'] },
    "personImages" : { action: ['person','images'], in_param: ['id'], out: [], optionals: ['language'] },
    
    "companyLookup" : { action: ['company','lookup'], in_param: ['id'], out: ['id', 'name'], optionals: [] },
    "companySearch" : { action: ['company','search'], in_param: ['query'], out: ['results.id', 'results.name'], optionals: ['page'] },
    "companyMovies" : { action: ['company','movies'], in_param: ['id'], out: ['id','results.id', 'results.title','results.original_title'], optionals: ['page', 'language'] },
    
    "collectionInfo" : { action: ['collection','info'], in_param: ['id'], out: ['id', 'name', 'parts.id','parts.title'], optionals: ['language'] },
    "collectionImages" : { action: ['collection','images'], in_param: ['id'], out: [], optionals: ['language'] }
    
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
        parameterObject[apiAction.in_param[apiConfig.in_param]] = query
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