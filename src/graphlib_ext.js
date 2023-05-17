import { Graph } from '@dagrejs/graphlib'

Graph.prototype.getSortFunction = function(sortBy) {
    function sortByProperty(a, b) {
        var pa = this.node(a)[sortBy];
        var pb = this.node(b)[sortBy];
        return (pa < pb) ? -1 : ((pa > pb) ? 1 : 0)
    }
    var sorter = (typeof sortBy === "function") ? sortBy : sortByProperty;
    return sorter
}

Graph.prototype.copy = function() {
    return this.filterNodes(() => true)
};

Graph.prototype.getSubgraphTree = function(n) {
    // var sorter = this.getSortFunction(sortBy)
    return this.children(n).map((childid) => {
        return {id: childid, children: this.getSubgraphTree(childid)};
    })
};

Graph.prototype.getSubgraphNodes = function(n, sortBy) {
    // var sorter = this.getSortFunction(sortBy)
    var children = this.children(n) //.sort(sorter)
    if (children === undefined) {
        return []
    }
    
    return [].concat(...children.map((n) => ([n, ...this.getSubgraphNodes(n, sortBy)])))
};

Graph.prototype.collapseSubgraph = function(n) {
    // Replaces an entire subgraph with just the parent node (n)
    // All edges in or out of this subgraph are replaced by edges to or from subgraph

    var subgraphNodes = this.getSubgraphNodes(n);

    var replaceEdges = [];

    subgraphNodes.forEach((subn) => {
        this.nodeEdges(subn).forEach((e) => {
            if (! (subgraphNodes.includes(e.w))) {
                replaceEdges.push({v: n, w: e.w})
            }
            else if (! (subgraphNodes.includes(e.v))) {
                replaceEdges.push({v: e.v, w: n})
            }
            this.removeEdge(e)
        }) 
        this.removeNode(subn)
    })

    replaceEdges.forEach((e) => {this.setEdge(e.v, e.w, {})})
};

export default Graph
