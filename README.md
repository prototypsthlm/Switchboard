Switchboard
===========

Setting it up
-------------

1. npm install in folder to setup dependencies.
2. copy connectors/keys_template.json to connectors/keys.json and fill in your API-keys.
3. create routine with chef or use an example routine from example_routines.
4. node server.js
5. http://localhost:4000/switchboard?q=entryquery


Node package
-------------

Optionally install as node package and:

1. var sb = require('switchboard');

2. configure keys as above in node_modules/switchboard/connectors

3. configure and set the switchboard routine:

		sb.setRoutine(userConfig); //for userConfig see below or folder example_routines 

4. insert query and run routine:

		sb.execute(entryquery, function(r,c){
			//r => raw call blocks 
			//c => a formatted response
		});

A userConfig is structured as:

	[
	    {
	        "order": "0", //execution order, if first the value api action param is set to the entry query value 
	        "api": "TMDB", //api name
	        "action": "movieSearch", //api action
	        "in_param": "0", //api action param name
	        "out": "0" //value for api action param name in next block. irrelevant if last block.
	    },
	    {
	        "order": "1",
	        "api": "TMDB",
	        "action": "movieCast",
	        "in_param": "0",
	        "out": "2"
	    },
	    {
	        "order": "2",
	        "api": "Spotify",
	        "action": "artistSearch",
	        "in_param": "0",
	        "out": "0"
	    }
	]