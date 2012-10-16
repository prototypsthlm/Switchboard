/**
Switchboard takes a JSON-routine and executes all connectors defined in the routine
in the specified order, gathering the result and at the end returning a merged object with
all results.

@module Switchboard
**/

var $ = require('jquery');
var async = require("async");
var jpath = require("node-jpath");

// get the resultFormatter class and all connectors
var Formatter = require('./results_formatter.js');
var SwitchboardJob = require("./switchboard_job.js");
var connectors = require('./connectors/connectors');
var logger = require('./sb_tracer.js')();

/**
Switchboard is a sort of engine, setting up and executing jobs which retrieve and format data through configured
data flows ("routines").

@class Switchboard 
@constructor

*/

/**
The mergeMethod (formatting method) to be used when formatting results.
@property mergeMethod
@type {String}
@default "extractMerge"
*/
/**
Array of jobs waiting to be executed.
@property jobs
@type {Array}
*/

function Switchboard() {

    var mergeMethod = "extractMerge";
    var jobs = [];
    var latestId = 0;

    /**
    Transforms a userRoutine to Switchboard-executable machineRoutine.

    @method translateUserRoutine
    @private
    @param {Object} userRoutine Object specifying API-methods and API-execution order
    @return {Object} Returns a machineRoutine reflecting the userRoutine data but with references to Connector objects
    
    */
    
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

    /**
    Runs when a job has finished. Initiates results formatting and sends everything back
    via callback.

    @method jobDone
    @private
    @param {Object} err Error object containing any thrown errors.
    @param {Object} response Object specifying API-methods and API-execution order
    @param {Function} callback Object specifying API-methods and API-execution order
    @param {String} mergeMethod Object specifying API-methods and API-execution order
    @param {Object} usedRoutine Object specifying API-methods and API-execution order
    
    */
    
    function jobDone(err, response, callback, mergeMethod, usedRoutine) {
        if(err) {            
            callback(err, usedRoutine, null, response);
            return;
        }
        
        logger.debug('Start results formatting.');
        
        var resultFormatter = new Formatter();
        
        resultFormatter.setRaw(response); //make a deep copy, copy objects not just references to objects
        
        var mergedResult = [];
        
        switch(mergeMethod) {
            
            case "injectMerge":
                mergedResult = resultFormatter.injectMerge();                
                break;
                
            case "extractMerge":
                mergedResult = resultFormatter.extractMerge();
                break;
                
            default:
                mergedResult = resultFormatter.extractMerge();
                 
        }
        
        logger.debug('Results formatted. Calling callback.');
        
        callback(err, usedRoutine, mergedResult, response); 
    }
    
    /**
    Gets a job by id.

    @method getJob
    @private
    @param {Integer} jobId Id of job to get.
    
    */
    
    function getJob(jobId) {
        for(var i in jobs) {
            if (jobs[i].id() == jobId) {
                return jobs[i];
            }
        }
        return null;
    }

    /**
    Remove a job.

    @method removeJob
    @private
    @param {Object} job Job to be removed.
    
    */
    
    function removeJob(job) {
        for(var i in jobs) {
            if (jobs[i].id() == job.id()) {
                logger.trace("Job "+job.id()+" at index",i," has been removed");
                jobs.splice(i,1);
                logger.trace("There are",jobs.length+" job(s) left");
            }
        }        
    }

    /**
    Executes and removes a Switchboard job. Triggers jobDone

    @method removeJob
    @private
    @param {Object} job Job to run.
    @param {Function} callback Callback to send onto jobDone
    @param {String} mergeMethod Merge method to use.
    
    */
    
    function runJob(job, callback, mergeMethod) {
        if(!job) return false; 
        removeJob(job);
        logger.debug('Job started.');
        logger.trace('Job.queries', job.entryQueries());
        job.run(function(err, response) { 
            logger.debug('Job done.');
            jobDone(err, response, callback, mergeMethod, job.userRoutine()); 
        });
        return true;
    }

    // Public methods
    return {    
        
        /**
        Transforms a userRoutine to Switchboard-executable machineRoutine.

        @method translateUserRoutine
        @param {Object} userRoutine Object specifying API-methods and API-execution order
        @return {Object} Returns a machineRoutine reflecting the userRoutine data but with references to Connector objects

        */
        translateUserRoutine: function(userRoutine) {
            return translateUserRoutine(userRoutine);
        },
        
        /**
        Sets the merge method.

        @method setMergeMethod
        @param {String} mergeMethod

        */
        
        setMergeMethod: function(mergeMethod) {
            this.mergeMethod = mergeMethod;
        },

        /**
          Sets the merge method.

          @method connectors
          @return {Object} Returns all imported connectors

        */
          
        connectors: function() {
            return connectors;
        },

        /**
          Add a job to the "queue".

          @method addJob
          @param {Object} userRoutine Routine to be used for the job
          @param {Array} entryQueries Array of queries to initiated the job. Can also be a single string
          @return {Integer} Returns the ID of the added job

        */
        
        addJob: function(userRoutine, entryQueries) {
            var machineRoutine = translateUserRoutine(userRoutine);
            var job = new SwitchboardJob(userRoutine, machineRoutine, entryQueries, ++latestId);
            jobs.push(job);
            return job.id();
        },

        /**
         Execute and remove a job from queue.

          @method runJob
          @param {Integer} jobId ID of the job to run
          @param {Function} callback Callback to be executed on job completion
          @param {String} mergeMethod Merge method to use

        */

        runJob: function(jobId, callback, mergeMethod) {
            var job = getJob(jobId);
            if(job) {
                runJob(job, callback, mergeMethod);
            }
        },

        /**
          Create, execute and remove a job from queue all in one go.

          @method addAndRunJob
          @param {Object} userRoutine Routine to be used for the job
          @param {Array} entryQueries Array of queries to initiate the job. Can also be a single string
          @param {Function} callback Callback to be executed on job completion
          @param {String} mergeMethod Merge method to use

        */

        addAndRunJob: function(userRoutine, entryQueries, callback, mergeMethod) {            
            var jobId = this.addJob(userRoutine, entryQueries);            
            this.runJob(jobId, callback, mergeMethod)
        },
        
        /**
          Execute all jobs in queue.

          @method run
          @param {Function} callback Callback to be executed on job completion
          @param {String} mergeMethod Merge method to use

        */
        
        run: function(callback, mergeMethod) {
            for(var i in jobs) {
                runJob(jobs[i], callback, mergeMethod);
            }
        }
        
    };
};

module.exports = new Switchboard();
