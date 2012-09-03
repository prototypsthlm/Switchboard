var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');

function RottenTomatoes(param) {
    this.name = "Rotten Tomatoes";
	this.host = param.host;
	this.responseObject = [];
	this.apiKey = param.apiKey;
}
util.inherits(RottenTomatoes, BaseConnector);


RottenTomatoes.prototype.getActionUrl = function(query, api_domain){    
    return this.host + api_domain + "/en/json/" + this.apiKey + "/" + encodeURI(query)
}

var rottentomatoes = new RottenTomatoes({
	host: "http://api.rottentomatoes.com/api/public/v1.0/",
	apiKey: "2cwpp3ykb7qwybvvaxnxudqy"
});

module.exports = rottentomatoes;

