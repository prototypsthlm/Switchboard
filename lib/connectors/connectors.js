connectors = {
    echonest: require('./echonest'),
    googlebooks: require('./googlebooks'),
    lastfm: require('./lastfm'),
    spotify: require('./spotify'),
    tmdb: require('./themoviedb'),
    filmnet: require('./filmnet'),
    viaplay: require('./viaplay'),
    netflix: require('./netflix')
};

var apiMap = {
    "Spotify" : connectors.spotify,
    "Echonest" : connectors.echonest,
    "Last.fm" : connectors.lastfm,
    "Google Books" : connectors.googlebooks,
    "TMDB" : connectors.tmdb,
    "Filmnet" : connectors.filmnet,
    "Viaplay" : connectors.viaplay,
    "Netflix" : connectors.netflix
}

connectors.apiMap = apiMap;
module.exports = connectors;
