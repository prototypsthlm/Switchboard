var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('../keys');

/* INS AND OUTS

//separate list for optionals?
//ubiq: results

id can be spotify href? :D 
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ ->
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify-WW%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ






{ in: ['artist','twitter', ['id','name']], out: ['artist.twitter'] }
{ in: ['artist','urls', ['id','name']], out: ['urls.lastfm_url','urls.aolmusic_url',urls.myspace_url','urls.amazon_url',urls.itunes_url','urls.mb_url'] }
{ in: ['artist','videos', ['id','name']], out: ['videos.title','videos.url',videos.site','videos.image_url',videos.id'] }


{ in: ['song','search', ['title','artist','combined','description','style','mood','artist_id','min_tempo','max_tempo','min_duration','max_duration','min_loudness','max_loudness', 'min_danceability','max_danceability', 'min_energy','max_energy', 'mode', 'key','bucket']], 
  out: ['songs.artist_id', 'songs.id', 'songs.artist_name', 'songs.title'] }
  { in: ['song','profile', ['id','track_id','bucket']], out: ['songs.artist_id', 'songs.id', 'songs.artist_name', 'songs.title'] }


Leftout: Track, Playlist, Taste Profile
*/

var apiActions = {
    "artistBiographies" : { action: ['artist','biographies'], in_param: ['id','name'], out: ['response.blogs.name', 'response.blogs.url'], optionals: ['results','start'] },
    "artistBlogs" : { action: ['artist','blogs'], in_param: ['id','name'], out: ['response.blogs.name', 'response.blogs.url'], optionals: ['results','start'] },
    "artistFamiliarity" : { action: ['artist','familiarity'], in_param: ['id','name'], out: ['response.artist.familiarity'], optionals: ['results','start'] },
    "artistHotness" : { action: ['artist','hotttnesss'], in_param: ['id','name'], out: ['response.artist.hotttnesss'], optionals: ['results','start'] },
    "artistImages" : { action: ['artist','hotttnesss'], in_param: ['id','name'], out: ['response.images.url'], optionals: ['results','start'] },
    "artistListTerms" : { action: ['artist','list_terms'], in_param: [], out: ['response.terms.name'], optionals: ['type'] },
    "artistNews" : { action: ['artist','biographies'], in_param: ['id','name'], out: ['response.news.url', 'response.news.id'], optionals: ['results','start', 'high_relevance'] },
    "artistProfile" : { action: ['artist','profile'], in_param: ['id','name'], out: ['response.artist.id', 'response.artist.name'], optionals: ['results','start','bucket'] },
    "artistReviews" : { action: ['artist','reviews'], in_param: ['id','name'], out: ['response.reviews.id', 'response.reviews.name'], optionals: ['results','start'] },
    "artistSearch" : { action: ['artist','search'], in_param: ['name'], out: ['response.artists.artist.id','response.artists.artist.name'], optionals: ['results','start','description','style','mood','bucket'] },
    "artistExtract" : { action: ['artist','extract'], in_param: ['text'], out: ['response.artists.artist.id','response.artists.artist.name'], optionals: ['results','start','bucket','max_familiarity','min_familiarity'] },
    "artistSongs" : { action: ['artist','songs'], in_param: ['id','name'], out: ['response.songs.id', 'response.songs.title'], optionals: ['results','start'] },
    "artistSimilar" : { action: ['artist','similar'], in_param: ['id','name'], out: ['response.artists.id', 'response.artists.name'], optionals: ['results','start','bucket','max_familiarity','min_familiarity'] },
    "artistSuggest" : { action: ['artist','suggest'], in_param: ['name'], out: ['response.artists.artist.id', 'response.artists.artist.name'] , optionals: ['results','start'] },
    "artistTerms" : { action: ['artist','terms'], in_param: ['id','name'], out: ['response.terms.name'] , optionals: ['results','start'] },
    "artistTopHot" : { action: ['artist','top_hottt'], in_param: [], out: ['response.artists.id'] , optionals: ['results','start','bucket'] },
    "artistTopTerms" : { action: ['artist','top_terms'], in_param: [], out: ['response.terms.name'] , optionals: ['results'] },
    "artistTwitter" : { action: ['artist','twitter'], in_param: ['id','name'], out: ['response.artist.twitter'] , optionals: [] },
    "artistURLs" : { action: ['artist','urls'], in_param: ['id','name'], out: ['response.urls.lastfm_url','response.urls.aolmusic_url','response.urls.myspace_url','response.urls.amazon_url','response.urls.itunes_url','response.urls.mb_url'], optionals: [] },
    "artistVideos" : { action: ['artist','videos'], in_param: ['id','name'], out: ['response.videos.title','response.videos.url','response.videos.site','response.videos.image_url','response.videos.id'] , optionals: ['results','start'] },
    
    "songSearch" : { action: ['song','search'], 
    in_param: ['title','artist','combined','description','style','mood','artist_id','min_tempo','max_tempo','min_duration','max_duration','min_loudness','max_loudness', 'min_danceability','max_danceability', 'min_energy','max_energy', 'mode', 'key'], 
    out: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: ['results','start','bucket'] },
    
    "songProfile" : { action: ['song','profile'], in_param: ['id','track_id'], out: ['response.songs.artist_id', 'response.songs.id', 'response.songs.artist_name', 'response.songs.title'], optionals: ['results','start','bucket'] }
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
    if(apiAction.in_param.length !== 0)
        parameterObject[apiAction.in_param[apiConfig.in_param]] = query;
    parameterObject['api_key'] = this.apiKey;
    
    var actionPath = domain + "/" + action + "?" + querystring.stringify(parameterObject);
    return this.host + actionPath
}

var echonest = new Echonest({
	host: "http://developer.echonest.com/api/v4/"
});

module.exports = echonest;
