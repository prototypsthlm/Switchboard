var $ = require('jquery');
/*
var injectResult = {
    "clean": cleanInjectResult,
    "raw": rawResult
};

var extractResult = {
    "clean": cleanExtractResult,
    "raw": rawResult
};
*/
/*
var results = {
    injectMerge: {
        all: extractResult,
        clean: cleanInjectResult,
        raw: rawResult
    },
    extractMerge: {
        all: extractResult,
        clean: cleanExtractResult,
        raw: rawResult
    },
    raw: rawResult
};
*/
function getResults(routine) {
    var routineFilename = "./results." + routine + ".js";
    var routineResult = require(routineFilename);
    //console.log(routineFilename, routineResult);

    var rawResult = routineResult.rawResult;
    var cleanInjectResult = routineResult.cleanInjectResult;
    var injectResult = {
        "clean": cleanInjectResult,
        "raw": rawResult
    };

    var cleanExtractResult = routineResult.cleanExtractResult;
    var extractResult = {
        "clean": cleanExtractResult,
        "raw": rawResult
    };

    var results = {
        injectMerge: {
            all: extractResult,
            clean: cleanInjectResult,
            raw: rawResult
        },
        extractMerge: {
            all: extractResult,
            clean: cleanExtractResult,
            raw: rawResult
        },
        raw: rawResult
    };
    
    return results; 
}


function Result(routine, typeOfResult, parseMethod) {
    //routine = routine == undefined ? 'starwars_artists' : routine;
    var results = getResults(routine);
    
    try {
        if(parseMethod == undefined) {
            if(typeOfResult == undefined) {
                return $.extend(true, {}, results);    
            }
            return $.extend(true, [], results[typeOfResult]);
        } else {
            return $.extend(true, [], results[parseMethod][typeOfResult]);
        }
    }
    catch(e) {
    }
    return undefined;
}

module.exports = Result;