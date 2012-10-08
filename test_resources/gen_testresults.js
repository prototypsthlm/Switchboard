/*
 * Generate resultfiles for the example routines.
 * 
*/

var Switchboard = require('../index');

 // Test data
var testData = {
	request: {query: {q: "Back to the future"}},
	queries: {		
		headliner_biographies: 'Skrillex',
		starwars_artists: "Titanic",
	}
};


function routine(routineName) {
	return require('../example_routines/'+ routineName +'.json');
};

function request(routineName) {
	return { query: { q: testData.queries[routineName] } };
};

function go(routineName) {

	var routine = require('../example_routines/'+ routineName +'.json');
	var request = "Titanic";

	console.log(routine);
	console.log(request);

	var jobId = Switchboard.addJob(routine, [request]);
    // Switchboard.runJob(jobId, function(usedRoutine, clean, raw) { handleResponse(usedRoutine, clean, raw, req, res, allowJSONP); });
   

	Switchboard.runJob(jobId, function (usedRoutine, clean, raw) {
		console.log(usedRoutine);
		console.log(clean);
		console.log(raw);
	});
};


go("starwars_artists");