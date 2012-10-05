var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var apiActions = {
    "albumSearch" : { action: ['album','search'], in_param_names: ['album'], output_nodes: ['albummatches.album.name','albummatches.album.artist','albummatches.album.id','albummatches.album.mbid'], optionals: [ 'page', 'limit' ] },
    "albumGetTopTags" : { action: ['album','getTopTags'], in_param_names: ['mbid'], output_nodes: ['toptags.tag.name', 'toptags.tag.count'] },
    
    "artistGetCorrection" : { action: ['artist','getCorrection'], in_param_names: ['artist'], output_nodes: ['corrections.correction.artist.name', 'corrections.correction.artist.mbid'] },
    "artistGetEvents" : { action: ['artist','getEvents'], in_param_names: ['artist','mbid'], output_nodes: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: ['page','limit'] },
    "artistGetInfo" : { action: ['artist','getInfo'], in_param_names: ['artist','mbid'], output_nodes: ['artist.name', 'artist.mbid', 'artist.similar.artist.name'], optionals: ['lang'] },
    "artistGetPastEvents" : { action: ['artist','getPastEvents'], in_param_names: ['artist','mbid'], output_nodes: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: ['page','limit'] },
    "artistGetPodcast" : { action: ['artist','getPodcast'], in_param_names: ['artist','mbid'], output_nodes: ['rss.channel.title', 'rss.channel.link'] },
    "artistGetShouts" : { action: ['artist','getShouts'], in_param_names: ['artist','mbid'], output_nodes: ['shouts.shout.body', 'shouts.shout.author'], optionals: ['page','limit'] },
    "artistGetSimilar" : { action: ['artist','getSimilar'], in_param_names: ['artist','mbid'], output_nodes: ['similarartists.artist.name', 'similarartists.artist.mbid'], optionals: ['limit'] },
    "artistGetTags" : { action: ['artist','getTags'], in_param_names: ['artist','mbid'], output_nodes: ['tags.tag.name', 'tags.tag.url']},
    "artistGetTopAlbums" : { action: ['artist','getTopAlbums'], in_param_names: ['artist','mbid'], output_nodes: ['topalbums.albums.name', 'topalbums.albums.mbid', 'topalbums.albums.playcount'], optionals: ['page','limit'] },
    "artistGetTopFans" : { action: ['artist','getTopFans'], in_param_names: ['artist','mbid'], output_nodes: ['topfans.user.name', 'topfans.user.realname'] },
    "artistGetTopTags" : { action: ['artist','getTopTags'], in_param_names: ['artist','mbid'], output_nodes: ['toptags.tag.name', 'toptags.tag.count']},
    "artistGetTopTracks" : { action: ['artist','getTopTracks'], in_param_names: ['artist','mbid'], output_nodes: ['toptracks.track.name', 'toptracks.track.mbid', 'toptracks.track.duration', 'toptracks.track.playcount'], optionals: ['page','limit'] },
    "artistSearch" : { action: ['artist','search'], in_param_names: ['artist'], output_nodes: ['artistmatches.artist.name', 'artistmatches.artist.mbid', 'artistmatches.artist.listeners','artistmatches.artist.url'], optionals: ['page','limit'] },
    
    "getHypedArtists" : { action: ['chart','getHypedArtists'], in_param_names: [], output_nodes: ['artists.artist.name', 'artists.artist.mbid', 'artists.artist.percentagechange'], optionals: ['page','limit'] },
    "getHypedTracks" : { action: ['chart','getHypedTracks'], in_param_names: [], output_nodes: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.percentagechange', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    "getLovedTracks" : { action: ['chart','getLovedTracks'], in_param_names: [], output_nodes: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.loves', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    "getTopArtists" : { action: ['chart','getTopArtists'], in_param_names: [], output_nodes: ['artists.artist.name', 'artists.artist.mbid','artists.artist.listeners','artists.artist.playcount'], optionals: ['page','limit'] },
    "getTopTags" : { action: ['chart','getTopTags'], in_param_names: [], output_nodes: ['tags.tag.name', 'tags.tag.reach','tags.tag.taggings'], optionals: ['page','limit'] },
    "getTopTracks" : { action: ['chart','getTopTracks'], in_param_names: [], output_nodes: ['tracks.track.name', 'tracks.track.mbid', 'tracks.track.duration', 'tracks.track.playcount', 'tracks.track.artist.name', 'tracks.track.artist.mbid'], optionals: ['page','limit'] },
    
    "eventGetAttendees" : { action: ['event','getAttendees'], in_param_names: ['event'], output_nodes: ['attendees.user.name','attendees.user.realname'], optionals: ['page','limit'] },
    "eventGetInfo" : { action: ['event','getInfo'], in_param_names: ['event'], output_nodes: ['event.id','event.title','event.artists.headliner', 'event.venue.id', 'event.venue.name','event.venue.location.city','event.venue.location.country', 'event.venue.location.street', 'event.venue.startDate'], optionals: ['page','limit'] },
    "eventGetShouts" : { action: ['event','getShouts'], in_param_names: ['event'], output_nodes: ['shouts.shout.body','shouts.shout.author'], optionals: ['page','limit'] },
    
    "geoGetEvents" : { action: ['geo','getEvents'], in_param_names: ['location'], output_nodes: ['event.id', 'event.title', 'event.tag', 'event.url', 'event.website', 'event.artists.artist', 'event.artists.headliner', 'event.venue.name', 'event.venue.location.city', 'event.venue.location.country', 'event.venue.location.street', 'event.venue.location.postalcode', 'event.venue.location.startDate', 'event.venue.url', 'event.venue.website', 'event.venue.phonenumber'], optionals: ['page','limit','distance','long','lat'] },
    
    "tagGetInfo" : { action: ['tag','getInfo'], in_param_names: ['tag'], output_nodes: ['tag.name','tag.reach','tag.taggings'], optionals: [] },
    "tagGetSimilar" : { action: ['tag','getSimilar'], in_param_names: ['tag'], output_nodes: ['similartags.tag.name'], optionals: [] },
    "tagGetTopAlbums" : { action: ['tag','getTopAlbums'], in_param_names: ['tag'], output_nodes: ['topalbums.album.name','topalbums.album.mbid','topalbums.album.artist.name','topalbums.album.artist.mbid'], optionals: ['page','limit'] },
    "tagGetTopArtists" : { action: ['tag','getTopArtists'], in_param_names: ['tag'], output_nodes: ['topartists.artist.name','topartists.artist.mbid'], optionals: ['page','limit'] },
    "tagGetTopTags" : { action: ['tag','getTopTags'], in_param_names: [], output_nodes: ['toptags.tag.name','toptags.tag.count'], optionals: [] },
    "tagGetTopTracks" : { action: ['tag','getTopTracks'], in_param_names: ['tag'], output_nodes: ['toptracks.track.name','toptracks.track.mbid','toptracks.track.artist.name','toptracks.track.artist.mbid'], optionals:  ['page','limit'] },
    "tagSearch" : { action: ['tag','search'], in_param_names: ['tag'], output_nodes: ['results.tagmatches.tag.name','results.tagmatches.tag.count'], optionals: ['page','limit'] },
    
    "trackSearch" : { action: ['track','search'], in_param_names: ['track'], output_nodes: ['results.trackmatches.track.name', 'results.trackmatches.track.mbid', 'results.trackmatches.track.listeners', 'results.trackmatches.track.artist.name'], optionals: ['page','limit','artist'] },
    
    "venueGetEvents" : { action: ['venue','getEvents'], in_param_names: ['venue'], output_nodes: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: [] },
    "venueGetPastEvents" : { action: ['venue','getPastEvents'], in_param_names: ['venue'], output_nodes: ['events.event.id', 'events.event.title', 'events.event.artists.artist', 'events.event.artists.headliner', 'events.event.venue.id', 
        'events.event.venue.name','events.event.venue.location.city','events.event.venue.location.country', 'events.event.venue.location.street', 'events.event.startDate'], optionals: ['page','limit'] },
    "venueSearch" : { action: ['venue','search'], in_param_names: ['venue'], output_nodes: ['results.venuematches.venue.name', 'results.venuematches.venue.id', 
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
        parameterObject[apiConfig.in_param_name] = query;        
    
    for(var param in apiConfig.optionals){
        parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue; 
    }
    
    parameterObject['api_key'] = this.apiKey;
    
    var actionPath = querystring.stringify(parameterObject);
    return this.host + "/2.0/?" + actionPath
}

var lastfm = new Lastfm({
	host: "http://ws.audioscrobbler.com"
});

module.exports = lastfm;
