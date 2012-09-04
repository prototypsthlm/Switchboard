var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('../keys');


/*    
    /// auth
    // 2 params if not mbid
    
    /page and limit on some of these!
    
    ///album.addTags
    //album.getBuylinks
    //album.getInfo
    //album.getShouts
    //album.getTags
    album.getTopTags
    //album.removeTag
    album.search : album
    
    { in: ['album','search', ['album','name']], out: ['images.url'] }
    
    ///album.share
    
    //artist.addTags
    artist.getCorrection : artist or mbid
    artist.getEvents : artist or mbid
    artist.getInfo : artist or mbid
    artist.getPastEvents : artist or mbid
    artist.getPodcast : artist or mbid
    artist.getShouts : artist or mbid
    artist.getSimilar : artist or mbid
    artist.getTags : artist or mbid
    artist.getTopAlbums : artist or mbid
    artist.getTopFans : artist or mbid
    artist.getTopTags : artist or mbid
    artist.getTopTracks : artist or mbid
    //artist.removeTag
    artist.search
    //artist.share
    //artist.shout
    
    chart.getHypedArtists : page and limit
    chart.getHypedTracks : page and limit
    chart.getLovedTracks : page and limit
    chart.getTopArtists : page and limit
    chart.getTopTags : page and limit
    chart.getTopTracks : page and limit
     
    //event.attend
    event.getAttendees : event (id)
    event.getInfo : event (id)
    event.getShouts : event (id)
    //event.share
    //event.shout
    
    ?geo.getEvents
    /geo.getMetroArtistChart
    /geo.getMetroHypeArtistChart
    /geo.getMetroHypeTrackChart
    /geo.getMetroTrackChart
    /geo.getMetroUniqueArtistChart
    /geo.getMetroUniqueTrackChart
    /geo.getMetroWeeklyChartlist
    /geo.getMetros
    /geo.getTopArtists
    /geo.getTopTracks
    
    tag.getInfo : tag
    tag.getSimilar : tag
    tag.getTopAlbums : tag
    tag.getTopArtists : tag
    tag.getTopTags : tag
    tag.getTopTracks : tag
    tag.getWeeklyArtistChart : tag
    tag.getWeeklyChartList : tag
    tag.search : tag
    
    ///track.addTags
    ///track.ban
    //track.getBuylinks
    //track.getCorrection
    //track.getFingerprintMetadata
    //track.getInfo
    //track.getShouts
    //track.getSimilar
    //track.getTags
    //track.getTopFans
    //track.getTopTags
    ///track.love
    ///track.removeTag
    ///track.scrobble
    track.search : track
    ///track.share
    ///track.unban
    ///track.unlove
    ///track.updateNowPlaying
    
    venue.getEvents : venue (id)
    venue.getPastEvents : venue (id)
    venue.search : venue (name) and country (ISO 3166-2)
    
    //ignored: User, Group, Tasteometer, Radio, Library, Playlist
    
    
*/

var apiActions = {
    "albumSearch" : { action: ['album','search'], in_param: ['album'], out: ['albummatches.album.name','albummatches.album.artist','albummatches.album.id','albummatches.album.mbid'], optionals: ['limit','page'] },
    "albumGetTopTags" : { action: ['album','getTopTags'], in_param: ['mbid'], out: ['toptags.tag.name', 'toptags.tag.count'] },
    "artistGetCorrection" : { action: ['artist','getCorrection'], in_param: ['artist'], out: ['corrections.correction.artist.name', 'corrections.correction.artist.mbid'] },
    "artistGetEvents" : { action: ['artist','getEvents'], in_param: ['artist','mbid'], 
        out: ['events.event.id', 'events.event.name', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.id','events.event.venue.name.location.city','events.event.venue.name.location.country', 'events.event.venue.startDate'],
        optionals: ['limit','page'] }
};

function Lastfm(param) {
    this.name = "last.fm";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
}

util.inherits(Lastfm, BaseConnector);

Lastfm.prototype.getActionUrl = function(query, apiConfig){
    var apiAction = apiActions[apiConfig.action];
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];  
     
    var parameterObject = {};
    parameterObject['method'] = domain + "." + action;
    parameterObject['format'] = 'json';
    if(domain != 'chart')
        parameterObject[apiAction.in_param[apiConfig.in_param]] = query;        
    
    parameterObject['api_key'] = this.apiKey;
    
    var actionPath = querystring.stringify(parameterObject);
    return this.host + "/2.0/?" + actionPath
}

var lastfm = new Lastfm({
	host: "http://ws.audioscrobbler.com"
});

module.exports = lastfm;
