var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var apiActions = {
    "albumSearch" : { action: ['album','search'], in_param: ['album'], out: ['albummatches.album.name','albummatches.album.artist','albummatches.album.id','albummatches.album.mbid'], optionals: ['limit','page'] },
    "albumGetTopTags" : { action: ['album','getTopTags'], in_param: ['mbid'], out: ['toptags.tag.name', 'toptags.tag.count'] },
    
    "artistGetCorrection" : { action: ['artist','getCorrection'], in_param: ['artist'], out: ['corrections.correction.artist.name', 'corrections.correction.artist.mbid'] },
    "artistGetEvents" : { action: ['artist','getEvents'], in_param: ['artist','mbid'], out: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'],optionals: ['limit','page'] },
    "artistGetInfo" : { action: ['artist','getInfo'], in_param: ['artist','mbid'], out: ['artist.name', 'artist.mbid', 'artist.similar.artist.name'], optionals: ['lang'] },
    "artistGetPastEvents" : { action: ['artist','getPastEvents'], in_param: ['artist','mbid'], out: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: ['page','limit'] },
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
    "getTopArtists" : { action: ['chart','getTopArtists'], in_param: [], out: ['artists.artist.name', 'artists.artist.mbid','artists.artist.listeners','artists.artist.playcount'], optionals: ['page','limit'] },
    "getTopTags" : { action: ['chart','getTopTags'], in_param: [], out: ['tags.tag.name', 'tags.tag.reach','tags.tag.taggings'], optionals: ['page','limit'] },
    "getTopTracks" : { action: ['chart','getTopTracks'], in_param: [], out: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.duration', 'tracks.track.playcount', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    
    "eventGetAttendees" : { action: ['event','getAttendees'], in_param: ['event'], out: ['attendees.user.name','attendees.user.realname'], optionals: ['page','limit'] },
    "eventGetInfo" : { action: ['event','getInfo'], in_param: ['event'], out: ['event.id','event.title','event.artists.headliner', 'event.venue.id', 'event.venue.name','event.venue.location.city','event.venue.location.country', 'event.venue.location.street', 'event.venue.startDate'], optionals: ['page','limit'] },
    "eventGetShouts" : { action: ['event','getShouts'], in_param: ['event'], out: ['shouts.shout.body','shouts.shout.author'], optionals: ['page','limit'] },
    
    "geoGetEvents" : { action: ['geo','getEvents'], in_param: ['location'], out: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.duration', 'tracks.track.playcount', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit','distance','long','lat'] },
    
    "tagGetInfo" : { action: ['tag','getInfo'], in_param: ['tag'], out: ['tag.name','tag.reach','tag.taggings'], optionals: [] },
    "tagGetSimilar" : { action: ['tag','getSimilar'], in_param: ['tag'], out: ['similartags.tag.name'], optionals: [] },
    "tagGetTopAlbums" : { action: ['tag','getTopAlbums'], in_param: ['tag'], out: ['topalbums.album.name','topalbums.album.mbid','topalbums.album.artist.name','topalbums.album.artist.mbid'], optionals: ['page','limit'] },
    "tagGetTopArtists" : { action: ['tag','getTopArtists'], in_param: ['tag'], out: ['topartists.artist.name','topartists.artist.mbid'], optionals: ['page','limit'] },
    "tagGetTopTags" : { action: ['tag','getTopTags'], in_param: [], out: ['toptags.tag.name','toptags.tag.count'], optionals: [] },
    "tagGetTopTracks" : { action: ['tag','getTopTracks'], in_param: ['tag'], out: ['toptracks.track.name','toptracks.track.mbid','toptracks.track.artist.name','toptracks.track.artist.mbid'], optionals:  ['page','limit'] },
    "tagSearch" : { action: ['tag','search'], in_param: ['tag'], out: ['results.tagmatches.tag.name','results.tagmatches.tag.count'], optionals: ['page','limit'] },
    
    "trackSearch" : { action: ['track','search'], in_param: ['tag'], out: ['results.trackmatches.track.name', 'results.trackmatches.track.mbid', 'results.trackmatches.track.listeners', 'results.trackmatches.track.artist.name'], optionals: ['page','limit','artist'] },
    
    "venueGetEvents" : { action: ['venue','getEvents'], in_param: ['venue'], out: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: [] },
    "venueGetPastEvents" : { action: ['venue','getPastEvents'], in_param: ['venue'], out: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: ['page','limit'] },
    "venueSearch" : { action: ['venue','search'], in_param: ['venue'], out: ['results.venuematches.venue.name', 'results.venuematches.venue.id', 
        'results.venuematches.venue.location.country', 'results.venuematches.venue.location.city', 'results.venuematches.venue.location.street'], optionals: ['page','limit','country'] }
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
