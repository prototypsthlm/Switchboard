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
        optionals: ['limit','page'] },
    "artistGetInfo" : { action: ['artist','getInfo'], in_param: ['artist','mbid'], out: ['artist.name', 'artist.mbid', 'artist.similar.artist.name'], optionals: ['lang'] },
    "artistGetPastEvents" : { action: ['artist','getPastEvents'], in_param: ['artist','mbid'], out: ['events.event.id', 'events.event.name', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
    'events.event.venue.id','events.event.venue.name.location.city','events.event.venue.name.location.country', 'events.event.venue.startDate'], optionals: ['page','limit'] },
    "artistGetPodcast" : { action: ['artist','getPodcast'], in_param: ['artist','mbid'], out: ['rss.channel.title', 'rss.channel.link'] },
    "artistGetShouts" : { action: ['artist','getShouts'], in_param: ['artist','mbid'], out: ['shouts.shout.body', 'shouts.shout.author'], optionals: ['page','limit'] },
    "artistGetSimilar" : { action: ['artist','getSimilar'], in_param: ['artist','mbid'], out: ['similarartists.artist.name', 'similarartists.artist.mbid'], optionals: ['limit'] },
    "artistGetTags" : { action: ['artist','getTags'], in_param: ['artist','mbid'], out: ['tags.tag.name', 'tags.tag.url']},
    "artistGetTopAlbums" : { action: ['artist','getTopAlbums'], in_param: ['artist','mbid'], out: ['topalbums.albums.name', 'topalbums.albums.mbid', 'topalbums.albums.playcount'], optionals: ['page','limit'] },
    "artistGetTopFans" : { action: ['artist','getTopFans'], in_param: ['artist','mbid'], out: ['topfans.user.name', 'topfans.user.realname'] },
    "artistGetTopTags" : { action: ['artist','getTopTags'], in_param: ['artist','mbid'], out: ['toptags.tag.name', 'toptags.tag.count']},
    "artistGetTopTracks" : { action: ['artist','getTopTracks'], in_param: ['artist','mbid'], out: ['toptracks.track.name', 'toptracks.track.mbid', 'toptracks.track.duration', 'toptracks.track.playcount'], optionals: ['page','limit'] },
    "artistSearch" : { action: ['artist','search'], in_param: ['artist'], out: ['artistmatches.artist.name', 'artistmatches.artist.mbid', 'artistmatches.artist.listeners','artistmatches.artist.url'], optionals: ['page','limit'] },
    
    "getHypedArtists" : { action: ['chart','getHypedArtists'], in_param: [], out: ['artists.artist.name', 'artists.artist.mbid', 'artists.artist.percentagechange'], optionals: ['page','limit'] },
    "getHypedTracks" : { action: ['chart','getHypedTracks'], in_param: [], out: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.percentagechange', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    "getLovedTracks" : { action: ['chart','getLovedTracks'], in_param: [], out: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.loves', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    "getTopArtists" : { action: ['chart','getTopArtists'], in_param: [], out: ['artists.artist.name', 'artists.artist.mbid','artists.artist.listeners','artists.artist.playcount'], optionals: ['page','limit'] }
    
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
