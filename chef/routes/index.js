var spotify = require('../../Connectors/spotify.js'); //fixa så include switchboard ist...?
var lastfm = require('../../Connectors/lastfm.js');
var echonest = require('../../Connectors/echonest.js');
var googlebooks = require('../../Connectors/googlebooks.js');
var tmdb = require('../../Connectors/themoviedb.js'); 

/*
 * GET home page.
 */

exports.index = function(req, res){
  console.log(spotify.apiActions);
  res.render('index', { title: 'Switchboard Chef', apis: [spotify, lastfm, echonest, googlebooks, tmdb], order: [0,1,2,3] });
};