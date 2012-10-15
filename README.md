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

Switchboard is a mashup-helper and it's basic functionality is enabling simple data flows between APIs: in essence taking a result from one API, feeding it to another and presenting the joined result for parsing and display in your app or whatever it might be. 

An example might be 

1. doing an artist search on Spotify
2. taking the first five artist names from the Spotify-result and searching Last.fm for upcoming events for these artists

A flow like this is described as a JSON config file that is then inputted to switchboard and specifies which API-actions to call and what data goes where. To help with the concoction of these config files, or "routines", switchboard is bundled with the utility application "the operator" which provides a UI for creating routines. Chef also helps in providing an oversight of existing API-methods as well as possible in-parameters and output-values for these. 

At the moment supported APIs include

* Echonest
* Google Books
* Last.fm
* Spotify
* The Movie Database

although not 100% of all API-actions are supported.

Setting it up as a service
-------------

Installing node: http://nodejs.org/

Running switchboard:

1. npm install in switchboard folder to set up dependencies
2. copy connectors/keys_template.json to connectors/keys.json and fill in your API-keys
3. create routine with the operator or use an example routine from example_routines
4. node server.js
5. http://localhost:4000/switchboard?q=entryquery 

You can also send routines as parameters to the switchboard service as mentioned below. POST data should be structured as:

		{
		    "q": "your entry query",
		    "routine": [
		        {
		            "api": "Spotify",
		            "action": "artistSearch",
		            "in_param_name": "q",
		            "value_source": "entry query",
		            "limit": "1"
		        },
		        {
		            "api": "Last.fm",
		            "action": "artistGetEvents",
		            "in_param_name": "artist",
		            "value_source": "artists.name",
		            "limit": "3"
		        },
		        {
		            "api": "Echonest",
		            "action": "artistBiographies",
		            "in_param_name": "name",
		            "value_source": "events.event.artists.headliner",
		            "limit": "3"
		        }
		    ]
		}

Using GET it would be:

	http://localhost:4000/switchboard?q=entryquery&routine=[%20{%20"api":%20"Spotify",%20"action":%20"artistSearch",%20"in_param_name":%20"q",%20"value_source":%20"entry%20query",%20"limit":%20"1"%20},%20{%20"api":%20"Last.fm",%20"action":%20"artistGetEvents",%20"in_param_name":%20"artist",%20"value_source":%20"artists.name",%20"limit":%20"3"%20},%20{%20"api":%20"Echonest",%20"action":%20"artistBiographies",%20"in_param_name":%20"name",%20"value_source":%20"events.event.artists.headliner",%20"limit":%20"3"%20}%20]

Running The Operator
-------------

1. npm install in the operator folder
2. node app.js
3. http://localhost:3000
5. make your routine and "set it" (execution order is top -> bottom)
6. the config is now live at http://localhost:3000/routine as well as stored in a routine.json file
7. input your config to switchboard by one of the below 
	* manually requiring from file as a JSON-variable (requires service restart)
	* automatically reading it from http://localhost:3000/routine on switchboard server instance startup (requires service restart to recognize routine changes)
	* sending the routine as a string via a GET-parameter to the service and executing it on the fly
	* POSTing the config as a parameter "routine" along with an entry query "q" to the service and executing it on the fly. the posted routine is now the "live" routine that will be executed for all calls to the service until another one is POSTed in

You can also run routines directly in the operator to get a view of the output.

Node package
-------------

Optionally install as a node package and:

1. var sb = require('switchboard');

2. configure keys as above in node_modules/switchboard/lib/connectors

3. configure and set up the switchboard routine:

	a userConfig is structured as:

		[
		    {
		        "api": "TMDB", //API-name
		        "action": "movieSearch", //API-method
		        "in_param_name": "query", //param name for the api action .ie ?in_param_name=value
		        "value_source": "entry query", //where to get value for the in_param, if first in routine always from initial request param otherwise a path to previous API-call JSON-results (see below)
		        "limit": 5, //the maximum amount of queries to take from value_source and execute
				"optionals": [ //an array of static querystrings to be sent along
		            {
		                "paramName": "year",
		                "paramValue": "1977" //&year=1977
		            }
		        ]
		    },
		    {
		        "api": "TMDB",
		        "action": "movieCast",
		        "in_param_name": "id",
		        "value_source": "results.id",
		        "limit": 5
		    },
		    {
		        "api": "Spotify",
		        "action": "artistSearch",
		        "in_param_name": "q",
		        "value_source": "cast.character",
		        "limit": 5
		    }
		]
		
	
	the syntax of value_sources is dot separated key names hierarchically descending. "results.object.id" would for example mean that the value for the key "id" in the the following structure would be selected:
	
		{
			"results": {
				object: {
					"id": "an id" //"an id" is selected
					"a_key": "another value"
				}
			}
		}
		
	one can look at the source for a connector, the API-method documentation or use the switchboard operator for a better overview of API-methods as well as possible in_param_names and value_sources.
		
 
4. insert query and routine:

		var jobId = sb.addJob(yourRoutine, ["an entry query"]);
		sb.runJob(jobId, function(usedRoutine, formatted, raw) {
			// usedRoutine => the inputted routine (for reference)
			// formatted => a formatted response with results from API-calls nestled with its value source
			// raw => raw call blocks 
		});
		
	alternatively
	
		sb.addAndRunJob(yourRoutine, ["entry query"], yourCallback(usedRoutine, formatted, raw));

JSONP
------

Switchboard supports JSONP. jQuery example usage:

		<html>
			<head>
				<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
				<script type="text/javascript">
					$(document).ready(function(){
				       $("a").click(function(event) {
				       		var dataType = $("#jsonpToggler").attr("checked") ? "jsonp" : "json";
							$.ajax({
							    url: 'http://localhost:4000/switchboard',
							    dataType: dataType,
							    type: 'get',
							    data: { q: "Star Wars"},
							    success: function(data) {
							    	$("#result").html(JSON.stringify(data));
							    },
							    error: function(data) {
							    	$("#result").html(JSON.stringify(data));
							    }
							});
							event.preventDefault();
						});
				    });
				</script>
			</head>
			<body>
				<p>Jsonp: <input type="checkbox" id="jsonpToggler" checked="checked" /></a>
				<p><a href="#" id="test">Do ajax request</a></p>
				<div id="result" style="margin-top:10px"></div>
			</body>
		</html>

or do it by script element injection (here with a routine sent along as well):

		<script type="text/javascript">
			function myHandler(response){
				console.log(response);
			}
		</script>
		<script type="text/javascript" src='http://localhost:4000/switchboard?q=star%20wars&routine=[%20{%20"api":%20"TMDB",%20"action":%20"movieSearch",%20"in_param_name":%20"query",%20"value_source":%20"entry%20query",%20"limit":%205,%20"optionals":%20[%20{%20"paramName":%20"year",%20"paramValue":%20"1977"%20}%20]%20},%20{%20"api":%20"TMDB",%20"action":%20"movieCast",%20"in_param_name":%20"id",%20"value_source":%20"results.id",%20"limit":%205%20},%20{%20"api":%20"Spotify",%20"action":%20"artistSearch",%20"in_param_name":%20"q",%20"value_source":%20"cast.character",%20"limit":%205%20}%20]&callback=myHandler'></script>


Tests
-------
Vows.

vows --spec in root

resultsformattertest
example_routines
test_config.json

		node /test_resources/gen_testresults.js

Logging
-------

Switchboard use the logging solution 'tracer' by [baryon](https://npmjs.org/~baryon).

The default environment and all the settings are found and specified in /lib/sb_tracer.js. If you wish to change the environment for a specific module, pass the environment as a param. var logger = require('./lib/sb_tracer.js')('prod');

levels:

+ 0, log - datadumps, ex: Lots and lots of json.
+ 1, trace - low-level information, ex: Entered small method setConfig.
+ 2, debug - general steps of flow, what happens? ex: Request recieved.
+ 3, info - good to know in production environment, ex: Server listening to port 1234.
+ 4, warn - might be a bad thing, ex: Default case in switch statement used, though a value should be used.
+ 5, error - houston we got a problem, ex: Could not load connector Abc. Often in catch().

When chosing level 4 in setup the logger will only output warns and errors.
Likewise logger.debug('Response sent.') will be seen only if level <= 2.