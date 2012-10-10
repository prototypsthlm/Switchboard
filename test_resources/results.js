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

function getPath(routine, type, method){
    var path = "./results/res."+routine+"."+type;
    return type==='raw' ? path+".json" : path+"."+method.replace('Merge', '')+".json"; 
}

/*
function getResults(routine) {
    var routineFilename = "./results.gen." + routine + ".json";
    var routineResult = require(routineFilename);
    //console.log(routineFilename, routineResult);

    var rawResult = require("");
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
*/

function Result(routine, typeOfResult, parseMethod) {
    //routine = routine == undefined ? 'starwars_artists' : routine;
    //var results = getResults(routine);
    return require(getPath(routine, typeOfResult, parseMethod));
    
    // try {
    //     if(parseMethod == undefined) {
    //         if(typeOfResult == undefined) {
    //             return $.extend(true, {}, results);    
    //         }
    //         return $.extend(true, [], results[typeOfResult]);
    //     } else {
    //         return $.extend(true, [], results[parseMethod][typeOfResult]);
    //     }
    // }
    // catch(e) {
    // }
    // return undefined;
}

module.exports = Result;