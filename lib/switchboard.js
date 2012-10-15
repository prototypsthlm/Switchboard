/**
Engine takes a JSON-routine and executes all connectors defined in the routine
in correct order, gathering the result and at the end returning a merged object with
all results.

@module Engine
**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");
// get the resultFormatter class and all connectors
var Formatter = require('./results_formatter.js');
var SwitchboardJob = require("./switchboard_job.js");
var connectors = require('./connectors/connectors');
var logger = require('./sb_tracer.js')();

function Switchboard() {

    var mergeMethod = "extractMerge";
    var jobs = [];
    var latestId = 0;

    /**
        Transforms a user routine to a switchboard machine routine with references to connector objects
    **/
    function translateUserRoutine(userRoutine){

      var machineRoutine = [];

        $.each(userRoutine, function(i,item){
           var routineObject = {};
           routineObject.connector = new connectors.apiMap[item.api];
           routineObject.options = { limit: item.limit == undefined ? 5 : item.limit };
           routineObject.apiConfig = { action: item.action, in_param_name: item.in_param_name, optionals: item.optionals, in_source: item.value_source };
           machineRoutine.push(routineObject);
        });
        
        return machineRoutine;
    }

    function jobDone(response, callback, mergeMethod, usedRoutine) {
        logger.debug('Start results formatting.');
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
        logger.debug('Results formatted. Calling callback.');
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
                logger.trace("Job "+job.id()+" at index",i," has been removed");
                jobs.splice(i,1);
                logger.trace("There are",jobs.length+" job(s) left");
            }
        }        
    }

    function runJob(job, callback, mergeMethod) {
        if(!job) return false; 
        removeJob(job);
        logger.debug('Job started.');
        logger.trace('Job.queries', job.entryQueries());
        job.run(function(response) { logger.debug('Job done.'); jobDone(response, callback, mergeMethod, job.userRoutine()); });
        return true;
    }

    // Public methods
    return {    
        
        /* Transforms a user routine to a machine routine with references to connector objects */
        translateUserRoutine: function(userRoutine) {
            return translateUserRoutine(userRoutine);
        },

        setMergeMethod: function(mergeMethod) {
            this.mergeMethod = mergeMethod;
        },

        connectors: function() {
            return connectors;
        },

        addJob: function(userRoutine, entryQueries) {
            var machineRoutine = translateUserRoutine(userRoutine);
            var job = new SwitchboardJob(userRoutine, machineRoutine, entryQueries, ++latestId);
            jobs.push(job);
            return job.id();
        },

        runJob: function(jobId, callback, mergeMethod) {
            var job = getJob(jobId);
            if(job) {
                runJob(job, callback, mergeMethod);
            }
        },

        addAndRunJob: function(userRoutine, entryQueries, callback, mergeMethod) {            
            var jobId = this.addJob(userRoutine, entryQueries);            
            this.runJob(jobId, callback, mergeMethod)
        },
        

        run: function(callback, mergeMethod) {
            for(var i in jobs) {
                runJob(jobs[i], callback, mergeMethod);
            }
        }
        
    };
};

module.exports = new Switchboard();
