var $ = require('jquery');
/**
    All connectors must return an object of this instance. By doing so we can make sure that we now
    some things for every result, i.e. how many results we retrieved
**/

function ConnectorResponse(resultObj, dataResult) {
    this.rawResult = $.extend(true, {}, resultObj.result);
	var result = dataResult;	// Must be results otherwise we need to change the recipe
	var meta = resultObj;
	delete meta["result"];
	
	return {
		meta: meta,	
		result: result,
		raw: rawResult		
	};
}

module.exports = ConnectorResponse;