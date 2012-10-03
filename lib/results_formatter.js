/**
* The ResultFormatter takes the response gathered by all connectors 
* and merges them to one clean result.
*
* @todo NODEPATHS MED NESTED ARRAYS ?! KOMMER SMÄLLA... ???
* @class ResultFormatter
* @constructor
* @param {Array} result Array holding the result gathered from all connectors
*/
var $ = require('jquery');
var jpath = require("node-jpath");


/**
* The constructor. The result given to the constructor is always cloned
* to ensure that the raw result isn't altered in any way
*
* @method
* @param {Array} result Array holding the result gathered from all connectors. Example: [{api: "Name of Connector A", calls: []}, {api: "Name of Connector B", calls: []}]
*/
function ResultFormatter(result) {    
    // raw contains the result retrieved by all connectors
    // raw cannot be accessed directly to ensure that the result is always cloned
    // Otherwise we would end up affecting the raw result while building the clean result
    var raw = typeof result != "object" ? [] : $.extend(true, [], result);
    //var raw = typeof result != "object" ? [] : result;
    // Public function to retrieve the cloned raw data
    this.raw = function() {
        return $.extend(true, [], raw);
    };

    // Public function to set the raw result. Always cloned
    this.setRaw = function(rawResult) {
        raw = $.extend(true, [], rawResult);
    };

}

/*  NODEPATHS MED NESTED ARRAYS ?! KOMMER SMÄLLA... */
ResultFormatter.prototype.injectMerge = function(){
   var cleanResult = this.raw();
   $.each(cleanResult, function(i,block){
       if(cleanResult.length-(i+2) >= 0){
           blockInject(cleanResult[cleanResult.length-(i+1)], cleanResult[cleanResult.length-(i+2)]); //inject things from child block into parent block
       }
   });
   return cleanResult;
};

ResultFormatter.prototype.extractMerge = function(){
    var cleanResult = [];
    var extractedRestul = null;
    var rawResults = this.raw();
    
    $.each(rawResults,function(i,block){ //this should be a while..?
        
        var index = rawResults.length-i-1;
        //console.log("------- Going through rawResults, i: " + i + ", index: "+index+" i+2==rawResults.length "+(i+2)+"=="+rawResults.length+" ---------");
        var prevBlock = index-1 >= 0 ? rawResults[index-1] : null;
        
        // Since we are building the clean result from the last connector block to the first
        // we know that we have reached the end when we don't have any previous block and hence no more data to extract
        if(prevBlock == null) {            
            return cleanResult;
        } 
        
        var currentBlock = rawResults[index];
        var nextBlock = index+1 < rawResults.length ? rawResults[index+1] : null;
        
        cleanResult = blockExtract(currentBlock, prevBlock, nextBlock);        
    });
   return cleanResult;
}


var setObjectDataOld = function(arr,parts, value) {
    if(parts.length > 1) {
        return setObjectData(arr[part], parts.pop(), value);
    }

    arr[parts[0]] = value;
    
    return arr;
}

var setObjectData = function(arr, parts, value) {
    if(parts.length > 1) {
        var part = parts.splice(0,1);
        if(arr[part] instanceof Array) {
            for(var i=0; i < arr[part].length; i++) {
                return setObjectData(arr[part][i], parts, value);    
            }
        } else {
            return setObjectData(arr[part], parts, value);
        }
        
    }
    arr[parts[0]] = value;
    
    return arr;
}

var sortByIndex = function(a, b) {
    if(a.meta.index < b.meta.index) return -1;
    if(a.meta.index > b.meta.index) return 1;
    return 0;
};


var blockExtract = function(currentBlock, prevBlock, nextBlock){
        //console.log("blockExtract(childBlock, parentBlock)", childBlock, parentBlock);
        var nodes = [];
        var leaves = currentBlock.calls;
        leaves.sort(sortByIndex);
        if(prevBlock != null) prevBlock.calls.sort(sortByIndex);
        if(nextBlock != null) nextBlock.calls.sort(sortByIndex);

        $.each(leaves,function(i,leaf){
            var nodePath = leaf.meta.apiConfig.in_source.split(".");
            nodePath.pop();
            //console.log("-------------------------");
            //console.log("ATTACHING: ")
            //console.log(leaf);
            //console.log("TO PARENT: ");
            
            var prevBlockResult = prevBlock != undefined ? prevBlock.calls[leaf.meta.callIndex].result : null;
            var resultPart = []; //varför måste det vara en array här? om vanlig variabel sätts den inte

            var node = getNode(nodePath, leaf, prevBlockResult);

            // If there are a next connector block we store the in_source (e.g. artists.artist.name) it used and the highest index value found
            // We need the in_source to determine which results should be removed from leaf.results
            // The index is needed to know how many results we should keep from the "in_source" part of leaf.results.
            // e.g in_source may be "artists.artist.name"
            // Then we know that we should look for leaf.result.artists.artist.name but we need the nextBlockMaxIndex
            // to find out how many of these items we should keep
            var nextBlockMaxIndex = 0;
            var nextBlockInSource = "";
            if(nextBlock != null) {
                for(var i in nextBlock.calls) {
                    var nextBlockCall = nextBlock.calls[i];
                    if(nextBlockCall.meta.callIndex != leaf.meta.index || nextBlockCall.meta.index <= nextBlockMaxIndex) {
                        continue;
                    }

                    nextBlockMaxIndex = nextBlockCall.meta.index;
                    nextBlockInSource = nextBlockCall.meta.apiConfig.in_source;
                }
            }

            if(nextBlockInSource != "") {
                var inSourceArr = nextBlockInSource.split(".");
                // Retrieve current result from the inSource pattern (e.g. artists.artist.name)
                inSourceArr = inSourceArr.splice(0,inSourceArr.length-1);
                // Remove result that the next connector result didn't use in a query
                var inSourceResult = jpath.filter(leaf.result, inSourceArr.join(".")).slice(0, nextBlockMaxIndex + 1);
                // Update the leaf with the inSourceResult
                // This object only contains results that has data that has been used by the next connector
                setObjectData(leaf.result, inSourceArr, inSourceResult);
            }

            injectNode(nodePath, node, leaf);

            nodes.push(node);
        });
        return nodes;
};

var injectNode =  function(nodePath, node, leaf){
    //console.log("INJECTING NODE");
    //console.log(nodePath);
    //console.log(tree);
    var level;
    if (!(node instanceof Array) && nodePath.length > 0){
        level = nodePath.shift();
    }
    
    if(nodePath.length > 0){
        if(node instanceof Array){ //if nested arrays in nodepath this will break.....
            injectNode(nodePath.slice(0), node[leaf.meta.index], leaf); //slice(0) => clone array...
        }
        else if(node[level] != null){
            injectNode(nodePath, node[level], leaf);                    
        }        
    }
    else if(node[level] instanceof Array){
        node[level][leaf.meta.index][leaf.meta.apiConfig.action] = leaf.result;
    }
    else if(node[level] != null) {            
        node[level][leaf.meta.apiConfig.action] = leaf.result;
    } else {
        node[leaf.meta.apiConfig.action] = leaf.result;
    }  

};

var getNode =  function(nodePath, leaf, tree){
    //console.log("getNode(nodePath, tree, leaf, objects)", nodePath, tree, leaf, objects);
    var node = [];
    var level;

    if (!(tree instanceof Array) && nodePath.length > 0){
        level = nodePath.shift();
    }

    if(nodePath.length > 0) {
        if(tree instanceof Array){ //nested arrays....this isn't the guaranteed end node              
            node = (tree[leaf.meta.index]);
        }
        else if(tree[level] != null) {
            return getNode(nodePath, leaf, tree[level]);               
        }
    }
    else {   
        node = (tree[level] instanceof Array ? tree[level][leaf.meta.index] : tree[level]);
    }    
    
    return node;
};

var blockInject = function(childBlock, parentBlock){
        var leaves = childBlock.calls;
        leaves.sort(sortByIndex);
        parentBlock.calls.sort(sortByIndex);
        $.each(leaves,function(i,leaf){
                var nodePath = leaf.meta.apiConfig.in_source.split(".");
                nodePath.pop();
                //console.log("-------------------------");
                //console.log("ATTACHING: ")
                //console.log(leaf);
                //console.log("TO PARENT: ");
                injectNode(nodePath, parentBlock.calls[leaf.meta.callIndex].result, leaf);
        });
        return parentBlock;
};



module.exports = ResultFormatter;