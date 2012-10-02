var connectors = require('../../index').connectors();

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Switchboard Chef', apis: [connectors.spotify, connectors.lastfm, connectors.echonest, connectors.googlebooks, connectors.tmdb], limits: [1,2,3,4,5,6,7,8,9,10] });
};