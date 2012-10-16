var $ = require('jquery');
/**
Contains results from a Connector HTTP-request.
All connectors must return an object of this instance. By doing so we can make sure that we know
some things for every result, i.e. how many results we retrieved.

@class ConnectorResponse 
@constructor
@param {Object} resultObject A config object containing machine routine data for this call
@return {Object} Return a new object containing formatted request meta-data, cloned raw response data and response data to be manipulated
*/

function ConnectorResponse(resultObject) {
    var rawResult = $.extend(true, {}, resultObject.result);
	var result = resultObject.result;
	var meta = resultObject;
	delete meta["result"];
	
	return {
		meta: meta,	
		result: result,
		raw: rawResult		
	};
}

module.exports = ConnectorResponse;