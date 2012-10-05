var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

/* INS AND OUTS

id can be spotify href? :D 
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ ->
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify-WW%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ { paramName: "", paramValues: [""] }

Leftout: Track, Playlist, Taste Profile
*/
var license = { paramName: "license", paramValues: ["echo-source", "all-rights-reserved", "cc-by-sa", "cc-by-nc", "cc-by-nc-nd", "cc-by-nc-sa", "cc-by-nd", "cc-by", "public-domain", "unknown"] };
var relevance = { paramName: "high_relevance", paramValues: ["true", "false"] };
var limit = { paramName: "limit", paramValues: ["true", "false"] };
var sort = { paramName: "sort", paramValues: ["familiarity-asc", "hotttnesss-asc", "familiarity-desc", "hotttnesss-desc", "artist_start_year-asc", "artist_start_year-desc", "artist_end_year-asc", "artist_end_year-desc"]}
var songSort = { paramName: "sort", paramValues: ["tempo-asc", "duration-asc", "loudness-asc", "artist_familiarity-asc", "artist_hotttnesss-asc", "artist_start_year-asc", "artist_start_year-desc", "artist_end_year-asc", "artist_end_year-desc", "song_hotttness-asc", "latitude-asc", "longitude-asc", "mode-asc", "key-asc", "tempo-desc", "duration-desc", "loudness-desc", "artist_familiarity-desc", "artist_hotttnesss-desc", "song_hotttnesss-desc", "latitude-desc", "longitude-desc", "mode-desc", "key-desc", "energy-asc", "energy-desc", "danceability-asc", "danceability-desc"]}
var apiActions = {
    "artistBiographies" : { action: ['artist','biographies'], in_param_names: ['id','name'], output_nodes: [], optionals: ['results','start',license] },
    "artistBlogs" : { action: ['artist','blogs'], in_param_names: ['id','name'], output_nodes: ['response.blogs.name', 'response.blogs.url'], optionals: ['results','start', relevance] },
    "artistFamiliarity" : { action: ['artist','familiarity'], in_param_names: ['id','name'], output_nodes: ['response.artist.familiarity'], optionals: ['results','start'] },
    "artistHotness" : { action: ['artist','hotttnesss'], in_param_names: ['id','name'], output_nodes: ['response.artist.hotttnesss'], optionals: ['results','start', { paramName: "type", paramValues: ["overall", "social", "reviews", "mainstream"] } ] },
    "artistImages" : { action: ['artist','hotttnesss'], in_param_names: ['id','name'], output_nodes: ['response.images.url'], optionals: ['results','start', license] },
    "artistListTerms" : { action: ['artist','list_terms'], in_param_names: [], output_nodes: ['response.terms.name'], optionals: [ { paramName: 'type', paramValues: ["style", "mood"] } ] },
    "artistNews" : { action: ['artist','biographies'], in_param_names: ['id','name'], output_nodes: ['response.news.url', 'response.news.id'], optionals: ['results','start', relevance] },
    "artistProfile" : { action: ['artist','profile'], in_param_names: ['id','name'], output_nodes: ['response.artist.id', 'response.artist.name'], optionals: ['results','start','bucket'] },
    "artistReviews" : { action: ['artist','reviews'], in_param_names: ['id','name'], output_nodes: ['response.reviews.id', 'response.reviews.name'], optionals: ['results','start'] },
    "artistSearch" : { action: ['artist','search'], in_param_names: ['name'], output_nodes: ['response.artists.artist.id','response.artists.artist.name'], 
        optionals: ['results','start','bucket',limit,'description','style','mood', { paramName: "rank_type", paramValues: ["relevance", "familiarity"] }, { paramName: "fuzzy_match", paramValues: ["true", "false"] },
        'max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss', "artist_start_year_before", "artist_start_year_after", "artist_end_year_before", "artist_end_year_after", sort] },
    "artistExtract" : { action: ['artist','extract'], in_param_names: ['text'], output_nodes: ['response.artists.artist.id','response.artists.artist.name'], optionals: ['results','start','bucket','max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss',limit,sort] },
    "artistSongs" : { action: ['artist','songs'], in_param_names: ['id','name'], output_nodes: ['response.songs.id', 'response.songs.title'], optionals: ['results','start'] },
    "artistSimilar" : { action: ['artist','similar'], in_param_names: ['id','name'], output_nodes: ['response.artists.id', 'response.artists.name'], optionals: ['results','min_results','start','bucket','max_familiarity','min_familiarity','max_hotttnesss','min_hotttnesss', "artist_start_year_before", "artist_start_year_after", "artist_end_year_before", "artist_end_year_after", limit] },
    "artistSuggest" : { action: ['artist','suggest'], in_param_names: ['name'], output_nodes: ['response.artists.artist.id', 'response.artists.artist.name'] , optionals: ['results','start'] },
    "artistTerms" : { action: ['artist','terms'], in_param_names: ['id','name'], output_nodes: ['response.terms.name'] , optionals: ['results','start', { paramName: "sort", paramValues: ["weight","frequency"] } ] },
    "artistTopHot" : { action: ['artist','top_hottt'], in_param_names: [], output_nodes: ['response.artists.id'] , optionals: ['results','start','bucket',limit] },
    "artistTopTerms" : { action: ['artist','top_terms'], in_param_names: [], output_nodes: ['response.terms.name'] , optionals: ['results'] },
    "artistTwitter" : { action: ['artist','twitter'], in_param_names: ['id','name'], output_nodes: ['response.artist.twitter'] , optionals: [] },
    "artistURLs" : { action: ['artist','urls'], in_param_names: ['id','name'], output_nodes: ['response.urls.lastfm_url','response.urls.aolmusic_url','response.urls.myspace_url','response.urls.amazon_url','response.urls.itunes_url','response.urls.mb_url'], optionals: [] },
    "artistVideos" : { action: ['artist','videos'], in_param_names: ['id','name'], output_nodes: ['response.videos.title','response.videos.url','response.videos.site','response.videos.image_url','response.videos.id'] , optionals: ['results','start'] },
    
    "songSearch" : { action: ['song','search'], 
    in_param_names: ['title','artist','combined','artist_id'], 
    output_nodes: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: ['results','start','bucket','min_tempo','max_tempo','min_duration','max_duration','min_loudness','max_loudness', 'min_danceability','max_danceability', 'min_energy','max_energy', 'mode', 'key', 'description','style','mood',limit, songSort] },
    
    "songProfile" : { action: ['song','profile'], in_param_names: ['id','track_id'], output_nodes: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: ['results','start','bucket',limit] }
};

function Echonest(param) {
    this.name = "Echonest";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
}

util.inherits(Echonest, BaseConnector);

Echonest.prototype.getActionUrl = function(query, apiConfig){
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];  
    
    var parameterObject = {};
    parameterObject['format'] = 'json';
    if(apiAction.in_param_names.length !== 0) //does the action take params at all?
        parameterObject[apiConfig.in_param_name] = query;
        
    parameterObject['api_key'] = this.apiKey;
    
    
    for(var param in apiConfig.optionals){
        parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue; 
    }
    
    var actionPath = domain + "/" + action + "?" + querystring.stringify(parameterObject);
    return this.host + actionPath
}

var echonest = new Echonest({
	host: "http://developer.echonest.com/api/v4/"
});

module.exports = echonest;
