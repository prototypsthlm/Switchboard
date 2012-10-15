var util = require('util');
var BaseConnector = require('./base_connector.js');
var ConnectorResponse = require('./connector_response.js');
var querystring = require('querystring');
var keys = require('./keys');
var jpath = require("node-jpath");

/* INS AND OUTS MAPPING FOR THE OPERATOR
Leftout: Track, Playlist, Taste Profile
*/
var license = { paramName: "license", paramValues: ["echo-source", "all-rights-reserved", "cc-by-sa", "cc-by-nc", "cc-by-nc-nd", "cc-by-nc-sa", "cc-by-nd", "cc-by", "public-domain", "unknown"] };
var relevance = { paramName: "high_relevance", paramValues: ["true", "false"] };
var limit = { paramName: "limit", paramValues: ["true", "false"] };
var sort = { paramName: "sort", paramValues: ["familiarity-asc", "hotttnesss-asc", "familiarity-desc", "hotttnesss-desc", "artist_start_year-asc", "artist_start_year-desc", "artist_end_year-asc", "artist_end_year-desc"]}
var songSort = { paramName: "sort", paramValues: ["tempo-asc", "duration-asc", "loudness-asc", "artist_familiarity-asc", "artist_hotttnesss-asc", "artist_start_year-asc", "artist_start_year-desc", "artist_end_year-asc", "artist_end_year-desc", "song_hotttness-asc", "latitude-asc", "longitude-asc", "mode-asc", "key-asc", "tempo-desc", "duration-desc", "loudness-desc", "artist_familiarity-desc", "artist_hotttnesss-desc", "song_hotttnesss-desc", "latitude-desc", "longitude-desc", "mode-desc", "key-desc", "energy-asc", "energy-desc", "danceability-asc", "danceability-desc"]}

//id:spotify-WW  songSearch requires track bucket too...
var foreignKeyBucket =  { paramName: "bucket", paramValues: ["id:spotify-WW", "id:musicbrainz"], info: "choose to receive foreign-keys to, for example, musicbrainz and spotify in the response" }

// http://developer.echonest.com/docs/v4/#project-rosetta-stone, no musicbrainz:track yet
// this is sort of a hack and should probably be a type in a in_param object (replacing "in_param_name")
var inParamTypesArtist = { paramName: "in param type", paramValues: ["musicbrainz:artist","spotify-WW:artist"], info: "specify the type of the in-parameter (spotify id etc.)" }
var inParamTypesTrack = { paramName: "in param type", paramValues: ["spotify-WW:track"], info: "specify the type of the in-parameter (spotify id etc.)" } 

var apiActions = {
    "artistBiographies" : { action: ['artist','biographies'], in_param_names: ['id','name'], output_nodes: [], optionals: [inParamTypesArtist,'results','start',license] },
    "artistBlogs" : { action: ['artist','blogs'], in_param_names: ['id','name'], output_nodes: ['response.blogs.name', 'response.blogs.url'], optionals: [inParamTypesArtist,'results','start', relevance] },
    "artistFamiliarity" : { action: ['artist','familiarity'], in_param_names: ['id','name'], output_nodes: ['response.artist.familiarity'], optionals: [inParamTypesArtist,'results','start'] },
    "artistHotness" : { action: ['artist','hotttnesss'], in_param_names: ['id','name'], output_nodes: ['response.artist.hotttnesss'], optionals: [inParamTypesArtist,'results','start', { paramName: "type", paramValues: ["overall", "social", "reviews", "mainstream"] } ] },
    "artistImages" : { action: ['artist','hotttnesss'], in_param_names: ['id','name'], output_nodes: ['response.images.url'], optionals: [inParamTypesArtist,'results','start', license] },
    "artistListTerms" : { action: ['artist','list_terms'], in_param_names: [], output_nodes: ['response.terms.name'], optionals: [ { paramName: 'type', paramValues: ["style", "mood"] } ] },
    "artistNews" : { action: ['artist','biographies'], in_param_names: ['id','name'], output_nodes: ['response.news.url', 'response.news.id'], optionals: [inParamTypesArtist,'results','start', relevance] },
    "artistProfile" : { action: ['artist','profile'], in_param_names: ['id','name'], output_nodes: ['response.artist.id', 'response.artist.name'], optionals: [inParamTypesArtist,foreignKeyBucket,'bucket','results','start'] },
    "artistReviews" : { action: ['artist','reviews'], in_param_names: ['id','name'], output_nodes: ['response.reviews.id', 'response.reviews.name'], optionals: [inParamTypesArtist,'results','start'] },
    "artistSearch" : { action: ['artist','search'], in_param_names: ['name'], output_nodes: ['response.artists.artist.id','response.artists.artist.name'], 
        optionals: [foreignKeyBucket,'bucket','results','start',limit,'description','style','mood', { paramName: "rank_type", paramValues: ["relevance", "familiarity"] }, { paramName: "fuzzy_match", paramValues: ["true", "false"] },
        'max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss', "artist_start_year_before", "artist_start_year_after", "artist_end_year_before", "artist_end_year_after", sort] },
    "artistExtract" : { action: ['artist','extract'], in_param_names: ['text'], output_nodes: ['response.artists.artist.id','response.artists.artist.name'], optionals: [foreignKeyBucket,'bucket','results','start','max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss',limit,sort] },
    "artistSongs" : { action: ['artist','songs'], in_param_names: ['id','name'], output_nodes: ['response.songs.id', 'response.songs.title'], optionals: [inParamTypesArtist,'results','start'] },
    "artistSimilar" : { action: ['artist','similar'], in_param_names: ['id','name'], output_nodes: ['response.artists.id', 'response.artists.name'], optionals: [inParamTypesArtist,foreignKeyBucket,'bucket','results','min_results','start','max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss', "artist_start_year_before", "artist_start_year_after", "artist_end_year_before", "artist_end_year_after", limit] },
    "artistSuggest" : { action: ['artist','suggest'], in_param_names: ['name'], output_nodes: ['response.artists.artist.id', 'response.artists.artist.name'] , optionals: ['results','start'] },
    "artistTerms" : { action: ['artist','terms'], in_param_names: ['id','name'], output_nodes: ['response.terms.name'] , optionals: [inParamTypesArtist,'results','start', { paramName: "sort", paramValues: ["weight","frequency"] } ] },
    "artistTopHot" : { action: ['artist','top_hottt'], in_param_names: [], output_nodes: ['response.artists.id'] , optionals: [inParamTypesArtist,foreignKeyBucket,'bucket','results','start',limit] },
    "artistTopTerms" : { action: ['artist','top_terms'], in_param_names: [], output_nodes: ['response.terms.name'] , optionals: ['results'] },
    "artistTwitter" : { action: ['artist','twitter'], in_param_names: ['id','name'], output_nodes: ['response.artist.twitter'] , optionals: [inParamTypesArtist] },
    "artistURLs" : { action: ['artist','urls'], in_param_names: ['id','name'], output_nodes: ['response.urls.lastfm_url','response.urls.aolmusic_url','response.urls.myspace_url','response.urls.amazon_url','response.urls.itunes_url','response.urls.mb_url'], optionals: [inParamTypesArtist] },
    "artistVideos" : { action: ['artist','videos'], in_param_names: ['id','name'], output_nodes: ['response.videos.title','response.videos.url','response.videos.site','response.videos.image_url','response.videos.id'] , optionals: ['results','start',inParamTypesArtist] },
    
    "songSearch" : { action: ['song','search'], 
    in_param_names: ['title','artist','combined','artist_id', 'min_duration','max_duration'], 
    output_nodes: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: [foreignKeyBucket,'bucket','results','start','min_tempo','max_tempo','min_duration','max_duration','min_loudness','max_loudness', 'min_danceability','max_danceability', 'min_energy','max_energy', 'mode', 'key', 'description','style','mood',limit, songSort] },
    
    "songProfile" : { action: ['song','profile'], in_param_names: ['id','track_id'], output_nodes: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: [foreignKeyBucket,inParamTypesTrack,'bucket','results','start', limit] }
};

function Echonest(param) {
    this.name = "Echonest";
	this.host = "http://developer.echonest.com/api/v4/";
	this.responseObject = [];
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
	this.docs = "http://developer.echonest.com/docs/v4/";
}

util.inherits(Echonest, BaseConnector);

/* move 'traverse-tree' part to base connector and have different formatters that can hook into it */
function cleanForeignKeys(result) {
    if(typeof result == "object") {
        for(var i in result) {
            var responsePart = result[i];
            if(typeof responsePart == "object") {
                cleanForeignKeys(responsePart);
            }
            else if(typeof responsePart == "string") {
                if(responsePart.indexOf('spotify-WW:') != -1) {
                     result[i] = result[i].replace('spotify-WW:','spotify:');                
                }
                else if(responsePart.indexOf('musicbrainz:artist:') != -1) {
                     result[i] = result[i].replace('musicbrainz:artist:','');              
                }
            }
            
        }
    }
}

/**
    Modifies the result, replacing spotify-WW: with the global identifier spotify: and removes musicbrainz:artist: style markup

    @param {Object} resultObj Result object as defined by the BaseConnector. Includes, among other things, the result returned by the API
    @return {ConnectorResponse}
**/
Echonest.prototype.connectorResult = function(resultObj) {
    cleanForeignKeys(resultObj.result); //do clone here...fix with connectorresponse
    return new ConnectorResponse(resultObj, resultObj.result);    
}

Echonest.prototype.getActionUrl = function(query, apiConfig){
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];  
    
    var parameterObject = {};
    parameterObject['format'] = 'json';
    if(apiAction.in_param_names.length !== 0) //does the action take params at all?
        parameterObject[apiConfig.in_param_name] = query;
        
    parameterObject['api_key'] = this.apiKey;
    
    var buckets = "";
    for(var param in apiConfig.optionals){
        if(apiConfig.optionals[param].paramName !== "in param type" && apiConfig.optionals[param].paramName !== "bucket"){
            parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue;
        }
        else if(apiConfig.optionals[param].paramName == "bucket") {//allow multiples of these, nice querstring override
            buckets = buckets + "&bucket=" + apiConfig.optionals[param].paramValue;
        }
        else {
            if(apiConfig.in_param_name == "id"){ //id only param that has types in this case
                if(apiConfig.optionals[param].paramValue.indexOf("spotify") != -1 && query.indexOf("spotify:") != -1){ //case of spotify-WW: solves itself since only echonest marks it like this
                    parameterObject[apiConfig.in_param_name] = query.replace("spotify:", "spotify-WW:");
                }
                else if(apiConfig.optionals[param].paramValue.indexOf("musicbrainz") != -1){
                    parameterObject[apiConfig.in_param_name] = "musicbrainz:artist:" + query;
                }
            }
        }
    }
    
    var actionPath = domain + "/" + action + "?" + querystring.stringify(parameterObject) + buckets;
    return this.host + actionPath
}

// var echonest = new Echonest({
// 	host: "http://developer.echonest.com/api/v4/"
// });

module.exports = Echonest;
