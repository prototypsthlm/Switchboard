/*
 * Generates resultfiles using the example routines specified below.
 * Testresults are used for testing the response from apis during development.
 *
 * Run this from Switchboard folder: 'node test_resources/gen_testresults.js'
 * 
 * This will generate files with the naming convention of:
 * 		[routineName].[raw/clean].[(extract/inject)?].json
 *		ex: artist_urls.clean.extract.json
 *
 * And be put in folder 'test_resources/results/'
 */


// Test data to be written. Specify each example_routine here.
var config = require('./test_config.json');

// REQUIRE
var fs = require('fs'),
	Switchboard = require('../index');


// NAMESPACE
var GenTestResults = {

	// Initialize the test data generation
	// keys=routineName, value=query
	init: function(config){
		for( var routineName in config.routineTestData ){							// Loop through routines
			for ( var i=0, len=config.mergeMethods.length; i<len; i++ ){							// Using both mergeMethods
				console.log(config.mergeMethods[i] + "mergeMethods");
				var query = config.routineTestData[routineName];					// Value of the key routineName is query string
				this.handleOne(routineName, query, config.mergeMethods[i], config);			// Send of to handleOne method
			}
		}
	},

	// Uses Switchboard to fetch data for one routine and sends it to the writing callback method.
	handleOne: function(routineName, query, mergeMethod, config) {
		var self = this;															// access to 'this' inside runJob
		var routine = require( config.folderRoutines + routineName +'.json' );		// get routine from path
		var jobId = Switchboard.addJob(routine, [query]);							// addJob

		// runJob
		Switchboard.runJob(jobId, function(usedRoutine, clean, raw){				
			self.writeResults(usedRoutine, clean, raw, routineName, config.folderTestResults, query, mergeMethod);
		}, mergeMethod);

	},

	// Writes the data to file. Used in handleOne. 
	writeResults: function(usedRoutine, clean, raw, routineName, folderTestResults, query, mergeMethod){
		var path = folderTestResults+"res."+routineName;
		if(mergeMethod == 'injectMerge'){
			this.writeItDown( path + ".clean.inject.json" , clean);						// Only clean
		} else {
			this.writeItDown( path + ".clean.extract.json" , clean);					// Clean
			this.writeItDown( path + ".raw.json" , raw);								// Raw
		}
	},

	writeItDown: function(path, json) {
		fs.writeFile(path, JSON.stringify(json, null, 4), function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("Testresults written to " + path);
			}
		});
	}
};

console.log(config);
GenTestResults.init(config);

