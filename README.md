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

1. npm install in switchboard folder to setup dependencies
2. copy connectors/keys_template.json to connectors/keys.json and fill in your API-keys
3. create routine with the operator or use an example routine from example_routines
4. node server.js
5. http://localhost:4000/switchboard?q=entryquery

You can also POST configs to the switchboard service as mentioned below. POST data should be structured as:

		{
		    "q": "your query",
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


Running The Operator
-------------

1. npm install in the operator folder
2. node app.js
3. http://localhost:3000
5. make your routine and "set it" (execution order is top -> bottom)
6. the config is now at http://localhost:3000/routine as well as in a routine.json file
7. input your config to switchboard by one of the below 
	* manually requiring from file as a JSON-variable (requires service restart)
	* automatically reading it from http://localhost:3000/routine on switchboard server instance startup (requires service restart to recognize routine changes)
	* POSTing the config as a parameter "routine" along with a entry query "q" to the service and executing it on the fly. the posted routine is now the "live" routine that will be executed for all calls to the service until another one is POSTed in

You can also run routines directly in the operator to get a view of the output.

Node package
-------------

Optionally install as a node package and:

1. var sb = require('switchboard');

2. configure keys as above in node_modules/switchboard/lib/connectors

3. configure and setup the switchboard routine:

	a userConfig is structured as:

		[
		    {
		        "api": "TMDB", //execution order, if first the value api of action param is set to the entry query value 
		        "action": "movieSearch", //api action
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
		
	one can look at the source for a connector, the API-method documentation or use the switchboard operator for a better overview of possible in_param_names and value_sources.
		
 
4. insert query and routine:

		var jobId = sb.addJob(yourRoutine, ["entry query"]);
		sb.runJob(jobId, function(usedRoutine, clean, raw) {
			//usedRoutine => the inputted routine (for reference)
			//clean => a formatted response
			//raw => raw call blocks 
		});
		
	alternatively
	
		sb.addAndRunJob(yourRoutine, ["entry query"], yourCallback(usedRoutine, clean, raw));

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

or do it by script element injection:

		<script type="text/javascript">
			function myHandler(response){
				console.log(response);
			}
		</script>
		<script type="text/javascript" src="http://localhost:4000/switchboard?q=star%20wars&callback=myHandler"></script>
