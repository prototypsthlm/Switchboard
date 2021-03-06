function sortByIndex(a, b) {
    if(a.meta.index < b.meta.index) return -1;
    if(a.meta.index > b.meta.index) return 1;
    return 0;
}

/**
Test helper.

@module Test
@class TestHelper 
@constructor

*/

function TestHelper() {}

/**
    Compares keys of two objects. 
    If compareValues == false. Values are not compared at all, we only care about the keys.
    The intended use of this function is to compare saved static result and results generated by a connector.
    Hence the amount of data does not need to be the same since the API response 
    contains "living" data that might be updated from time to time.

    @method TestHelper.prototype.compareObjects
    @param {Object} obj1 The result object we want to test
    @param {Object} obj2 The result object with the real structure, e.g. our expected test data
    @return {bool}  
**/

TestHelper.prototype.compareObjects = function(obj1, obj2, compareValues) {
    var valid = true;
    compareValues = compareValues == undefined ? true: compareValues;
    if(obj1 != null && typeof obj1 == "object" && typeof obj2 == typeof obj1) {
        // We need to sort the result by index otherwise the mapping may differ between obj1 and obj2 since
        // the calls are async
        if(obj1.calls) {
            obj1.calls.sort(sortByIndex);
            obj2.calls.sort(sortByIndex);
        }
        for(var key in obj1) {
            var isArray = obj1 instanceof Array;

            // Check if the key exists in obj2 (only check if obj1 isn't an array)
            if(!isArray && !(key in obj2)) {
                console.log(key+" not in obj2", obj2);
                return false;
            }

            // The value of the object is an object so we digg deeper to compare the "children"
            if(typeof obj1[key] == "object") {
                if(obj1[key] != null) {                    
                    valid = this.compareObjects(obj1[key], obj2[key], compareValues);
                }
            }
            else if(compareValues) {
                valid = obj1[key] == obj2[key];
                if(!valid) {
                    console.log("Value of "+key+" differs:");
                    console.log("obj1["+key+"]:\n", obj1[key]);
                    console.log("obj2["+key+"]:\n", obj2[key]);
                }
            }

            if(!valid) {
                console.log("Returning false");
                return false;
            }

            // If obj1 is an array and has more items than obj2 we simply break
            // It doesn't matter if this is the case since we are interested in
            // comparing the keys and not the exact data
            if(isArray && parseInt(key)+1 > obj2.length) {
                break;
            }
        }
    } else if(compareValues) {
        valid = obj1 == obj2;
        if(!valid) {
            console.log("Value of obj1 and obj2 differs:");
            console.log("obj1:\n", obj1);
            console.log("obj2:\n", obj2);
        }
    }
    if(!valid) console.log("Return valid "+valid);
    return valid;
};

module.exports = new TestHelper();
