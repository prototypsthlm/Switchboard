/**
Switchboard helper. Contains helper functions to be used within the Switchboard module.

@module Switchboard
@class SwitchboardHelper 
@constructor

*/

var $ = require('jquery');
var logger = require('./sb_tracer.js')();

function SwitchboardHelper() {}


/**
	Goes through the path and finds the first part of the path that is an array
    
    @method findFirstArrayFromPath
    @public
    @param {String} valueSourcePath String containing a dot notated path used to traverse an object. Every dot indicates a new level in the object.
    @return {String} Returns the path leading to the first array found in the path
    
*/
SwitchboardHelper.prototype.findFirstArrayFromPath = function(valueSourcePath) {
    // Look for the first array in the path used to retrieve current query
    var parts = valueSourcePath.split('.');
    var pathToArrayParts = [];
    for(var i in parts) {
        var part = parts[i];                
        if(!isNaN(part)) {
            break;
        }
        pathToArrayParts.push(part);
    }
    return pathToArrayParts.join('.');
}


/**
	Goes through the path and finds the first part of the path that is an array
    
    @method findFirstArrayInPath
    @public
    @param {Object} obj Object that should be used to look for the first array
    @param {String} valueSource A dot notated path, as defined in a user routine, where the first array should be found
    @return {String} Returns the path leading to the first array found in the path
    
*/
SwitchboardHelper.prototype.findFirstArrayFromValueSource = function(obj, valueSource, index) {	
    index = index == undefined ? 0 : index;

    var valueSourceArray = valueSource.split('.');
    var valueSourcePart = valueSourceArray[index];  

    if(obj) {
        if(obj[valueSourcePart] instanceof Array) {
            valueSourceArray.splice(index+1,valueSourceArray.length);
            return valueSourceArray.join('.');
        } else {                
            return this.findFirstArrayFromValueSource(obj[valueSourcePart], valueSource, ++index);
        }
    }
    
    return null;
}


/*
    Updates a object with new data given a set of keys that should be traversed
    
    E.g.
    If you want to add data to the artist, e.g. website, you need to use the following data

    var obj = {                                 // The object you want to update; 
        artists: {
            artist: {
                name: "Spice Girls"                    
            }
        },
        events: {...}
    };                                          
    keys = ['artists', 'artist', 'website'];    // The keys specifying where the updated value should be set
    value = 'http://www.thespicegirls.com/';    // The value you want to set

    setObjectData(obj, keys, value);

    obj after function is called:

    { 
        artists: {
            artist: {
                name: "Spice Girls",
                website: 'http://www.thespicegirls.com/'                 
            }
        },
        events: {...}
    };   

    @param {Object} obj The object you want to update
    @param {Object} keys An array with keys leading to the location in the object where you want to set your value.
    @param {Mix} value The value you want to set
*/
SwitchboardHelper.prototype.setObjectData = function(obj, keys, value) {
    if(obj == undefined) {
        logger.warn("Object is undefined. Doing nothing");
        return obj;
    }
    if(keys.length > 1) {
        var key = keys.splice(0,1);
        
        if(obj[key] instanceof Array && !isNaN(keys[0])) {
            keys[0] = parseInt(keys[0]);
        }
        return this.setObjectData(obj[key], keys, value);
    }
    
    if(keys[0] == undefined) {
        logger.trace("Replacing whole object with value");        
        obj = value;
    }
    else {        
        logger.trace((keys[0] in obj ? "Replacing" : "Updating") + "  value for key "+keys[0]);        
        if(keys[0] in obj)
        {                
            $.extend(true, obj[keys[0]], value);
        }
        else {
            obj[keys[0]] = value;
        }
        
    }
    
    return obj;
}


/**
	Returns the data the keys points to in an object

    @method getObjectData
    @public
    @param {Object} obj Object containing the information we want to retrieve
    @param {Array} keys An array with keys leading to the inforamtion we want. E.g. keys = ['artists', 'artist', 0] will traverse the oject, first looking for artists, then artist and return the data found at the first index.
    @return {Mixed} Returns the data found in the object
    
*/
SwitchboardHelper.prototype.getObjectData = function(obj, keys) { 
    if(obj == undefined) {        
        return obj;
    }    
    if(keys.length > 1) {
        var key = keys.splice(0,1);
        
        if(obj[key] instanceof Array && !isNaN(keys[0])) {
            keys[0] = parseInt(keys[0]);
        }
        return this.getObjectData(obj[key], keys);
    }
    
    if(keys[0] == undefined) {            
        return obj;
    }
    else if(keys[0] in obj) {            
        return obj[keys[0]];
    }
    return undefined;
}
module.exports = new SwitchboardHelper();