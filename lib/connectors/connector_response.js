var $ = require('jquery');
/**
    All connectors must return an object of this instance. By doing so we can make sure that we now
    some things for every result, i.e. how many results we retrieved
**/

function ConnectorResponse(resultObject, dataResult) {
    var rawResult = $.extend(true, {}, resultObject.result);
	var result = dataResult; // Must be results otherwise we need to change the routine
	var meta = resultObject;
	delete meta["result"];
	
	return {
		meta: meta,	
		result: result,
		raw: rawResult		
	};
}

module.exports = ConnectorResponse;