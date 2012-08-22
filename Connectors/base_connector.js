function BaseConnector(param) {
	this.host = param.host;
	this.responseObject = [];
}

// Inherit from EventEmitter
//BaseConnector.prototype = new process.EventEmitter;

//BaseConnector.prototype.search = function(query, collector) {
BaseConnector.prototype.get = function(url, done) {

    request(url, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        console.log("returned result");
        this.responseObject.push({key: cat, value: query, result: JSON.parse(result)});
      }
      done();
    });
    
}

BaseConnector.prototype.execute = function() {
    console.log("NOT IMPLEMENTED!");
}

module.exports = BaseConnector;
