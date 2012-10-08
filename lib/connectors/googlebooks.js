var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var volumeOuts = ['items.id','items.volumeInfo.publisher','items.volumeInfo.title','items.volumeInfo.authors'];
var apiActions = {
    //https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor:herpderp&key=yourAPIKey
    "volumesSearch" : { action: ['volumes','search'], in_param_names: ['q'], output_nodes: volumeOuts, 
        optionals: [
                { paramName: 'download', paramValues: ['epub'] },
                { paramName: 'filtering', paramValues: ['partial','full', 'free-ebooks', 'paid-ebooks', 'ebooks'] },
                 'startIndex', 'maxResults', 
                { paramName: "printType", paramValues: ["all","books","magazines"] }, 
                { paramName: "orderBy", paramValues: ['relevance','newest'] }, 
                { paramName: "projection", paramValues: ['full','lite'] }, 
                { paramName: "q scope", paramValues: ['intitle','inauthor','inpublisher','subject','isbn'] } 
            ] },
      //https://www.googleapis.com/books/v1/volumes/volumeId
    "volumesLookup" : { action: ['volumes','lookup'], in_param_names: ['volumeID'], output_nodes: volumeOuts }
};
//inga bookshelves...

function GoogleBooks(param) {
    this.name = "Google Books";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
}
util.inherits(GoogleBooks, BaseConnector);

GoogleBooks.prototype.getActionUrl = function(query, apiConfig){    
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];
     
    var parameterObject = {};
    parameterObject['key'] = this.apiKey;
    var actionPath;
    if(action == 'search'){
        parameterObject[apiConfig.in_param_name] = query;
        for(var param in apiConfig.optionals){
            if(apiConfig.optionals[param].paramName == "q scope")
                parameterObject[apiConfig.in_param_name] = apiConfig.optionals[param].paramValue + ":" + query;
            else
                parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue;
        }        
        actionPath = domain + "?" + querystring.stringify(parameterObject);
    }
    else {
        actionPath = domain + "/" + query + "?" + querystring.stringify(parameterObject);
    }
    
    console.log(actionPath);
    
    
    return this.host + actionPath
}

var googlebooks = new GoogleBooks({
	host: "https://www.googleapis.com/books/v1/"
});

module.exports = googlebooks;