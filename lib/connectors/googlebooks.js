var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var volumeOuts = ['items.id','items.volumeInfo.publisher','items.volumeInfo.title','items.volumeInfo.authors'];
var apiActions = {
    //https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor:herpderp&key=yourAPIKey
    "volumesSearch" : { action: ['volumes','search'], in_param_names: ['q'], output_nodes: volumeOuts, special: ['intitle','inauthor','inpublisher','subject','isbn'], optionals: ['download','filtering','pagination','sorting'] },
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