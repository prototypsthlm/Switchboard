<pre>
	                   __/\ \__       /\ \    /\ \                               /\ \    
	  ____  __  __  __/\_\ \ ,_\   ___\ \ \___\ \ \____    ___      __     _ __  \_\ \   
	 /',__\/\ \/\ \/\ \/\ \ \ \/  /'___\ \  _ `\ \ '__`\  / __`\  /'__`\  /\`'__\/'_` \  
	/\__, `\ \ \_/ \_/ \ \ \ \ \_/\ \__/\ \ \ \ \ \ \L\ \/\ \L\ \/\ \L\.\_\ \ \//\ \L\ \ 
	\/\____/\ \___x___/'\ \_\ \__\ \____\\ \_\ \_\ \_,__/\ \____/\ \__/.\_\\ \_\\ \___,_\
	 \/___/  \/__//__/   \/_/\/__/\/____/ \/_/\/_/\/___/  \/___/  \/__/\/_/ \/_/ \/__,_ /

</pre>

What does it do?
-------------

Switchboard is a mashup-helper and it's basic functionality is enabling simple data flows between APIs: in essence taking a result from one API, feeding it to another and presenting the joined result for display in your app or whatever it might be. 

An example might be 

1. doing an artist search on Spotify
2. taking the first five artist names from the Spotify-result and searching last.fm for upcoming events for these artists

A flow like this is described as a JSON config file that is then inputted to switchboard and specifies which API-actions to call and what data goes where. To help with the concoction of these config files, or "routines", switchboard is bundled with the utility application "chef" which provides a UI for creating routines. 

At the moment supported APIs include

* Echonest
* Google Books
* last.fm
* Spotify
* The Movie Database

although not 100% of all API-actions are supported.

Setting it up as a service
-------------

1. npm install in switchboard folder to setup dependencies
2. copy connectors/keys_template.json to connectors/keys.json and fill in your API-keys
3. create routine with chef or use an example routine from example_routines
4. node server.js
5. http://localhost:4000/switchboard?q=entryquery

Running chef
-------------

1. npm install in chef folder
2. http://localhost:3000
3. make your recipe and write it down
4. the config is now at http://localhost:3000/recipe as well as in a recipe.json file
5. feed your config to switchboard

Node package
-------------

Optionally install as a node package and:

1. var sb = require('switchboard');

2. configure keys as above in node_modules/switchboard/connectors

3. configure and set the switchboard routine:

		sb.setRoutine(userConfig); //for userConfig see below or folder example_routines 

	a userConfig is structured as:

		[
		    {
		        "order": "0", //execution order, if first the value api of action param is set to the entry query value 
		        "api": "TMDB", //api name
		        "action": "movieSearch", //api action
		        "in_param": "0", //index for api action param name
		        "out": "0" //the index for the value for the api action param name in the next block. irrelevant if last block.
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
		
	look at the source for a connector or use the switchboard chef for a better understanding of how the indices for in_param and out work.
 
4. insert query and run routine:

		sb.execute(entryquery, function(r,c){
			//r => raw call blocks 
			//c => a formatted response
		});

