/**
Engine takes a json configuration and executes all connectors defined in the config
in correct order, gathering the result and at the end returning a merged object with
all results.

@module Engine
**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");
//get the resultFormatter class and all connectors
var Formatter = require('./results_formatter.js');
//var Engine = function() {};
var EngineJob = require("./engine_job.js");
var connectors = require('./connectors/connectors');

function Engine() {

    var mergeMethod = "extractMerge";
    var jobs = [];
    var latestId = 0;

    /**
        Transforms a user routine to a switchboard machine routine with references to connector objects
    **/
    function translateUserConfig(userRoutine){

      var translatedRoutine = [];

        $.each(userRoutine, function(i,item){
           var routineObject = {};
           routineObject.connector = new connectors.apiMap[item.api];
           routineObject.options = { limit: item.limit == undefined ? 5 : item.limit };
           routineObject.apiConfig = { action: item.action, in_param_name: item.in_param_name, optionals: item.optionals, in_source: item.value_source };
           translatedRoutine.push(routineObject);
        });
        
        return translatedRoutine;
    }

    function jobDone(response, callback, mergeMethod, usedRoutine) {
        var resultFormatter = new Formatter();
        resultFormatter.setRaw(response); //make a deep copy, copy objects not just references to objects
        var mergedResult = [];
        switch(mergeMethod) {
            case "injectMerge":
                mergedResult = resultFormatter.injectMerge();                
                break;
            case "extractMerge":            
            default:
                mergedResult = resultFormatter.extractMerge();
                 
        }       
        callback(usedRoutine, mergedResult, response); 
    }
    
    function getJob(jobId) {
        for(var i in jobs) {
            if (jobs[i].id() == jobId) {
                return jobs[i];
            }
        }
        return null;
    }

    function removeJob(job) {
        for(var i in jobs) {
            if (jobs[i].id() == job.id()) {
                console.log("Job "+job.id()+" at index",i," has been removed");
                jobs.splice(i,1);
                console.log("There are",jobs.length+" job(s) left");
            }
        }        
    }

    function runJob(job, callback, mergeMethod) {
        if(!job) return false;
        removeJob(job);
        job.run(function(response) { jobDone(response, callback, mergeMethod, job.userRoutine()); });   
        return true;     
    }

    // Public methods
    return {    
        
        getQueries: function(config, connectorResponse) {        
             return getQueries(config, connectorResponse);
        },

        setRequest: function(request) { //entry query
            req = request;
        },
        setLiveRoutine: function(userRoutine) { //entry query
            liveRoutine = userRoutine;
        },
        
        /* transforms a user config to a switchboard config with references to connector objects */
        translateUserConfig: function(userRecipe) {
            return translateUserConfig(userRecipe);
        },

        setMergeMethod: function(mergeMethod) {
            this.mergeMethod = mergeMethod;
        },

        connectors: function() {
            return connectors;
        },

        addJob: function(userRecipe, request) {
            var translatedConfig = translateUserConfig(userRecipe);
            var job = new EngineJob(userRecipe, translatedConfig, request, ++latestId);
            jobs.push(job);
            return job.id();
        },

        runJob: function(jobId, callback, mergeMethod) {
            var job = getJob(jobId);
            if(job) {
                runJob(job, callback, mergeMethod);
            }
        },

        addAndRunJob: function(userRecipe, request, callback, mergeMethod) {            
            var jobId = this.addJob(userRecipe, request);            
            this.runJob(jobId, callback, mergeMethod)
        },
        

        run: function(callback, mergeMethod) {
            for(var i in jobs) {
                runJob(jobs[i], callback, mergeMethod);
            }
        }
        
    };
};

module.exports = new Engine();
