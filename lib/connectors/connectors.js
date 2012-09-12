connectors = {
    echonest: require('./echonest'),
    googlebooks: require('./googlebooks'),
    lastfm: require('./lastfm'),
    spotify: require('./spotify'),
    tmdb: require('./themoviedb')
};
var apiMap = {
    "Spotify" : connectors.spotify,
    "Echonest" : connectors.echonest,
    "last.fm" : connectors.lastfm,
    "Google Books" : connectors.googlebooks,
    "TMDB" : connectors.tmdb
}

connectors.apiMap = apiMap;
module.exports = connectors;
