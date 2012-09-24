var $ = require('jquery');
var jpath = require("node-jpath");

function ResultFormatter(result) {
	this.raw = null;
}

/*  NODEPATHS MED NESTED ARRAYS ?! KOMMER SMÄLLA... */
ResultFormatter.prototype.injectMerge = function(){
   var rawResults = this.raw;
   $.each(rawResults, function(i,block){
       if(rawResults.length-(i+2) >= 0){
           blockInject(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]); //inject things from child block into parent block
       }
   });
   return rawResults;
};

ResultFormatter.prototype.extractMerge = function(){
    var extractedObjects = [];
    var rawResults = $.extend(true, [], this.raw);
    $.each(rawResults,function(i,block){ //this should be a while..?
        
        var index = rawResults.length-i-1;
        console.log("------- Going through rawResults, i: " + i + ", index: "+index+" i+2==rawResults.length "+(i+2)+"=="+rawResults.length+" ---------");
        var prevBlock = index-1 >= 0 ? rawResults[index-1] : null;
        var currentBlock = rawResults[index];
        var nextBlock = index+1 < rawResults.length ? rawResults[index+1] : null;

        if(prevBlock != null) {
            var obj = blockExtract(currentBlock, prevBlock, nextBlock);
            // Jag fattar inte villkoret (i+2) == rawResults.length men det verkar funka. 
            if(obj != null && (i+2) == rawResults.length) {
                extractedObjects.push(obj);    
            }
            else {
                console.log("NO OBJECT SHOULD BE PUSHED", obj);
            }
        }
    });
   return extractedObjects;
}


var setObjectData = function(arr,parts, value) {
    if(parts.length > 1) {
        return setObjectData(arr[part], parts.pop(), value);
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
            //nodepath borde här inte vara komplett...frågan är hur den ser ut i olika case'
            //console.log("node\n", node);


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
        /*console.log("ARRAY");
        console.log(leaf);
        console.log("---->");
        console.log(node[level][leaf.index]);
        /**/
        node[level][leaf.meta.index][leaf.meta.apiConfig.action] = leaf.result;
    }
    else if(node[level] != null) {            
        node[level][leaf.meta.apiConfig.action, leaf.result] = leaf.result;
    } else {
        node[leaf.meta.apiConfig.action] = leaf.result;
    }  

};


var getNode =  function(nodePath, leaf, tree){
    //console.log("getNode(nodePath, tree, leaf, objects)", nodePath, tree, leaf, objects);
    var node = null;
    var level;

    if (!(tree instanceof Array) && nodePath.length > 0){
        level = nodePath.shift();
    }

    if(nodePath.length > 0) {
        if(tree instanceof Array){ //nested arrays....this isn't the guaranteed end node              
            node = tree[leaf.meta.index];
        }
        else if(tree[level] != null) {
            node = getNode(nodePath, tree[level], leaf, objects);            
        }
    }
    else {   
        node = tree[level] instanceof Array ? tree[level][leaf.meta.index] : tree[level];
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



module.exports = new ResultFormatter();
