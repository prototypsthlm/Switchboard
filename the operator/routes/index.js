var connectors = require('../../index').connectors();

/*
 * GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: 'The Operator', apis: [new connectors.spotify, new connectors.lastfm, new connectors.echonest, new connectors.googlebooks, new connectors.tmdb], limits: [1,2,3,4,5,6,7,8,9,10] });
};