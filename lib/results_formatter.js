var $ = require('jquery');

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
    extractedObjects = [];
    var rawResults = this.raw;
    $.each(rawResults,function(i,block){ //this should be a while..?
        if(rawResults.length-(i+2) >= 0){
            if((i+2) == rawResults.length)
                extractedObjects.push(blockExtract(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]));
            else
                blockExtract(rawResults[rawResults.length-(i+1)], rawResults[rawResults.length-(i+2)]);
        }
    });
   return extractedObjects;
};

var blockExtract = function(childBlock, parentBlock){
        var objects = [];
        var leaves = childBlock.calls;
        leaves.sort(function(a,b){ //because gotten asynchronous
            if(a.index < b.index) return -1;
            if(a.index > b.index) return 1;
            return 0;
        });
        parentBlock.calls.sort(function(a,b){ //because gotten asynchronous
            if(a.index < b.index) return -1;
            if(a.index > b.index) return 1;
            return 0;
        });
        $.each(leaves,function(i,leaf){
                var nodePath = leaf.apiConfig.in_source.split(".");
                nodePath.pop();
                //console.log("-------------------------");
                //console.log("ATTACHING: ")
                //console.log(leaf);
                //console.log("TO PARENT: ");
                var tmp = []; //varför måste det vara en array här? om vanlig variabel sätts den inte
                getNode(nodePath, parentBlock.calls[leaf.callIndex].result, leaf, tmp);
                //nodepath borde här inte vara komplett...frågan är hur den ser ut i olika case
                injectNode(nodePath, tmp[0], leaf);
                objects.push(tmp[0]);
        });
        return objects;
};

var blockInject = function(childBlock, parentBlock){
        var leaves = childBlock.calls;
        leaves.sort(function(a,b){
            if(a.index < b.index) return -1;
            if(a.index > b.index) return 1;
            return 0;
        });
        parentBlock.calls.sort(function(a,b){
            if(a.index < b.index) return -1;
            if(a.index > b.index) return 1;
            return 0;
        });
        $.each(leaves,function(i,leaf){
                var nodePath = leaf.apiConfig.in_source.split(".");
                nodePath.pop();
                //console.log("-------------------------");
                //console.log("ATTACHING: ")
                //console.log(leaf);
                //console.log("TO PARENT: ");
                injectNode(nodePath, parentBlock.calls[leaf.callIndex].result, leaf);
        });
        return parentBlock;
};

var getNode =  function(nodePath, tree, leaf, objects){
    var level;
    if (!(tree instanceof Array) && nodePath.length > 0){
        level = nodePath.shift();
    }
    
    if(nodePath.length > 0){
        if(tree instanceof Array){ //nested arrays....this isn't the guaranteed end node  
            //$.each(tree, function(i){
                console.log(leaf);
                //getNode(nodePath.slice(0), tree[i], leaf, objects); //slice(0) => clone array
                objects.push(tree[leaf.index]);
            //});
        }
        else{
            if(tree[level] != null)
                getNode(nodePath, tree[level], leaf, objects);
            else
                return tree;
        }
    }
    else {            
        if(tree[level] instanceof Array){
            //console.log("ARRAY");
            //console.log(nodePath);
            objects.push(tree[level][leaf.index]);
        }
        else {
            //console.log("NOT ARRAY");
            //console.log(nodePath);
            
            objects.push(tree[level]);
            node = tree[level]
        }
    }
};


var injectNode =  function(nodePath, tree, leaf){
    //console.log("INJECTING NODE");
    //console.log(nodePath);
    //console.log(tree);
    var level;
    if (!(tree instanceof Array) && nodePath.length > 0){
        level = nodePath.shift();
    }
    
    if(nodePath.length > 0){
        if(tree instanceof Array){ //if nested arrays in nodepath this will break.....
                injectNode(nodePath.slice(0), tree[leaf.index], leaf); //slice(0) => clone array...
        }
        else {
            if(tree[level] != null){
                injectNode(nodePath, tree[level], leaf);                    
            }
            else{
                console.log("INVALID NODE");
            }
                
        }
    }
    else {            
        if(tree[level] instanceof Array){
            /*console.log("ARRAY");
            console.log(leaf);
            console.log("---->");
            console.log(tree[level][leaf.index]);*/
            tree[level][leaf.index][leaf.apiConfig.action] = leaf.result;
        }
        else {
            /*console.log("NOT ARRAY");
            console.log(leaf);
            console.log("---->");
            console.log(tree[level]);*/
            if(tree[level] != null)
                tree[level][leaf.apiConfig.action] = leaf.result;
            else
                tree[leaf.apiConfig.action] = leaf.result;
        }
    }
};

module.exports = new ResultFormatter();
