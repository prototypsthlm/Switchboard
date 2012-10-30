
/*
 * GET home page.
 */
var switchboard = require('swtchbrd');
var routine = require('../routine.json'); // routine from json-file

exports.index = function(req, res){
    switchboard.addAndRunJob(routine, ["star wars"], function(error, usedRoutine, formatted, raw){
        res.render('index', { title: 'Switchboard Template for Node Express', usedRoutine: usedRoutine, data: formatted }); 
    });
};