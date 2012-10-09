/*
 * Generates resultfiles using the example routines specified below.
 * Testresults are used for testing the response from apis during development.
 */


/* Test data to be written. Specify each example_routine here. */
var config = {
	
	folderRoutines: '../example_routines/',
	folderTestResults: './test_resources/',

	routineTestData: {
		artist_urls: 'Foo',
		starwars_artists: 'Bilbo',
		headliner_biographies: 'Moa Lignell'
	}
};



// REQUIRE
var fs = require('fs'),
	Switchboard = require('../index');



// NAMESPACE
var GenTestResults = {

	// Initialize the test data generation
	init: function(config){

		// Loop through routineTestData
		// Use key as routine
		// Use value as input data
		for( var routineName in config.routineTestData ){
			var query = config.routineTestData[routineName];
			this.handleOne(routineName, query, config);
		}
	},

	// Fetches data for one routine and runs the callback.
	handleOne: function(routineName, query, config) {

		var routine = require( config.folderRoutines + routineName +'.json' ),
			jobId = Switchboard.addJob(routine, [query]),
			self = this;


		Switchboard.runJob(jobId, function(usedRoutine, clean, raw){				
			self.writeResults(usedRoutine, clean, raw, routineName, config.folderTestResults, query);
		});

	},

	// Writes the data to file, used in handleOne 
	writeResults: function(usedRoutine, clean, raw, routineName, folderTestResults, query){
		var path = folderTestResults+"results.gen."+routineName+".json";
		fs.writeFile(path, JSON.stringify(clean, null, 4), function(err) {
	        if(err) {
	            console.log(err);
	        } else {
	            console.log("Testresults written to " + path);
	        }
    	});
	}
};

GenTestResults.init(config);

