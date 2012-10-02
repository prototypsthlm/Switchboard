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
var getQueriesData = [];


function Engine() {

    var mergeMethod = "extractMerge";
    var jobs = [];
    var latestId = 0;

    /**
        Transforms a user config to a switchboard config with references to connector objects
    **/
    function translateUserConfig(config){

        var translatedConfig = [];

        config.sort(function(a,b){
            if(a.order < b.order) return -1;
            if(a.order > b.order) return 1;
            return 0;
        });
        
        $.each(config, function(i,item){
           var routineObject = {};
           routineObject['connector'] = connectors.apiMap[item.api];
           routineObject.options = { limit: item.limit == undefined ? 5 : item.limit };
           var in_source;
           if (item.order == 0){
               in_source = "request.get";
           }
           else {
               var prevConnect = translatedConfig[i-1].connector;
               in_source = prevConnect.apiActions[config[i-1].action].out[config[i-1].out]
           }
           routineObject.apiConfig = { action: item.action, in_source: in_source, in_param: item.in_param };
           translatedConfig.push(routineObject);
        });
        //console.log("service config built:");
        //console.log(translatedConfig);
        return translatedConfig;
    }

    function jobDone(response, callback, mergeMethod) {
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
        callback(response, mergedResult); 
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
        job.run(function(response) { jobDone(response, callback, mergeMethod); });   
        return true;     
    }

    // Public methods
    return {

        setMergeMethod: function(mergeMethod) {
            this.mergeMethod = mergeMethod;
        },

        getConnectors: function() {
            return connectors;
        },

        addJob: function(userRecipe, request) {
            var translatedConfig = translateUserConfig(userRecipe);
            var job = new EngineJob(translatedConfig, request, ++latestId);
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
            console.log("lkajsdlakjds");
            var jobId = this.addJob(userRecipe, request);
            console.log("add and run ", jobId);
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