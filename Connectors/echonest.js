var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');

/* INS AND OUTS

//separate list for optionals?
//ubiq: results

id can be spotify href? :D 
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ ->
http://developer.echonest.com/api/v4/artist/blogs?format=json&id=spotify-WW%3Aartist%3A4kwxTgCKMipBKhSnEstNKj&api_key=DI6KQHZO8BXXRWKGJ

{ in: ['artist','biographies', ['id','name']], out: null }
{ in: ['artist','blogs', ['id','name']], out: ['blogs.name', 'blogs.url'] }
{ in: ['artist','familiarity', ['id','name']], out: ['artist.familiarity'] }
{ in: ['artist','hotttnesss', ['id','name']], out: ['artist.hotttnesss'] }
{ in: ['artist','images', ['id','name']], out: ['images.url'] }
{ in: ['artist','list_terms', ['type']], out: ['terms.name'] } //mood or style
{ in: ['artist','news', ['id','name']], out: ['news.url','news.id'] }
{ in: ['artist','profile', ['id','name','bucket']], out: ['artist.id','artist.name'] }
{ in: ['artist','reviews', ['id','name']], out: ['reviews.id','reviews.name'] }
{ in: ['artist','search', ['id','description','style','mood','bucket']], out: ['artists.artist.id','artists.artist.name'] }
{ in: ['artist','extract', ['text','bucket']], out: ['artists.artist.id','artists.artist.name'] }
{ in: ['artist','songs', ['id','name']], out: ['songs.id', 'songs.title'] }
{ in: ['artist','similar', ['id','name','bucket']], out: ['artists.id', 'artists.name'] }
{ in: ['artist','suggest', ['id','name','bucket']], out: ['artists.artist.id', 'artists.artist.name'] }
{ in: ['artist','terms', ['id','name']], out: ['terms.name'] }
{ in: ['artist','top_hottt', []], out: ['artists.id'] }
{ in: ['artist','top_terms', []], out: ['terms.name'] }
{ in: ['artist','twitter', ['id','name']], out: ['artist.twitter'] }
{ in: ['artist','urls', ['id','name']], out: ['urls.lastfm_url','urls.aolmusic_url',urls.myspace_url','urls.amazon_url',urls.itunes_url','urls.mb_url'] }
{ in: ['artist','videos', ['id','name']], out: ['videos.title','videos.url',videos.site','videos.image_url',videos.id'] }


{ in: ['song','search', ['title','artist','combined','description','style','mood','artist_id','min_tempo','max_tempo','min_duration','max_duration','min_loudness','max_loudness', 'min_danceability','max_danceability', 'min_energy','max_energy', 'mode', 'key','bucket']], 
  out: ['songs.artist_id', 'songs.id', 'songs.artist_name', 'songs.title'] }
  { in: ['song','profile', ['id','track_id','bucket']], out: ['songs.artist_id', 'songs.id', 'songs.artist_name', 'songs.title'] }


Leftout: Track, Playlist, Taste Profile
*/

function Echonest(param) {
    this.name = "Echonest";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = param.apiKey;
}

util.inherits(Echonest, BaseConnector);

Echonest.prototype.getActionUrl = function(query, api_domain){
    var actionBreakdown = api_domain.split(".");
    var domain = actionBreakdown.shift(); //t ex "artist"
    var action = actionBreakdown.shift();   
    var parameter = actionBreakdown.shift();
    
    var parameterObject = {};
    parameterObject['format'] = 'json';
    parameterObject[parameter] = query;
    parameterObject['api_key'] = this.apiKey;
    
    var actionPath = domain + "/" + action + "?" + querystring.stringify(parameterObject);
    return this.host + actionPath
}

var echonest = new Echonest({
	host: "http://developer.echonest.com/api/v4/",
	apiKey: "DI6KQHZO8BXXRWKGJ"
});

module.exports = echonest;
