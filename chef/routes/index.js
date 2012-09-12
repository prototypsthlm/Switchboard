var connectors = require('../../index').connectors();

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Switchboard Chef', apis: [connectors.spotify, connectors.lastfm, connectors.echonest, connectors.googlebooks, connectors.tmdb], order: [0,1,2,3] });
};