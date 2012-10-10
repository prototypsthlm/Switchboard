var connectors = require('../../index').connectors();

/*
 * GET home page.
 */
exports.index = function(req, res){
  var apis = []
  for(var connector in connectors){
      if (connectors.hasOwnProperty(connector)) {
         if(connector != "apiMap"){
             var connectorInstance = new connectors[connector];
             if(connectorInstance.apiKey && connectorInstance.apiKey != null && connectorInstance.apiKey != "")
                apis.push(connectorInstance);
            }
       }
  }
  res.render('index', { title: 'The Operator', apis: apis, limits: [1,2,3,4,5,6,7,8,9,10] });
};