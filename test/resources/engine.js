/**
	Engine holds data used in switchboard.js (Engine). 

	Data is generated using:
	- Routine: starwars_artists.json
	- Query: Back to the future
	
**/

var $ = require('jquery');
var config = require('./engine.config.js');
var connectorResponse = require('./engine.connector_response.js');
var callSessions = require('./engine.call_sessions.js');

function EngineData(callNr) {
	var index = callNr - 1;	
	return $.extend(true, {}, {config: config.data[index], connectorResponse: connectorResponse.data[index], callSessions: callSessions.data[index]});
}

module.exports = EngineData;