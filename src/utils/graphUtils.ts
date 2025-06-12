import { Graph, alg } from '@dagrejs/graphlib'

/**
 * A simple union-find (aka disjoint set) implementation
 * used for node contraction
 */
class UnionFind {
  parent: Map<string, string>;
  constructor(els: string[]) {
    this.parent = new Map(els.map(e => [e, e]));
  }
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      return x
    }
    const p = this.parent.get(x);
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root); // Path compression
      return root;
    }
    return x;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(ra, rb);
    }
  }
}
/**
 * Collapse clusters in the compound graph. Returns the new graph.
 * Any node that is a descendant of an anchor node (in the anchorIds set) will be collapsed,
 * and the edge relationships will be rewired accordingly.
 * What is the behavoiur when an anchor node is a descendant of another anchor node?
 * Your guess is as good as mine.
 */
export function collapseHierarchy(graph: Graph, anchorIds: Set<string>, includeParents: boolean = true): Graph {
  const uf = new UnionFind(graph.nodes());
  for (const n of graph.nodes()) {
    if (!anchorIds.has(n)) {
      let cur: string | undefined = n;
      while (cur) {
        const p = graph.parent(cur);
        if (!p) break;
        if (anchorIds.has(p)) {
          uf.union(n, p);
          break
        }
        cur = p;
      }
    }
  }
  const collapsedGraph = new Graph({ directed: true, compound: true });
  collapsedGraph.setGraph(graph.graph());
  const addNode = (n : string) => {
    if (graph.hasNode(n) && !collapsedGraph.hasNode(n)) {
      collapsedGraph.setNode(n, graph.node(n));
      if (includeParents) {
        const p = graph.parent(n);
        if (p) {
          collapsedGraph.setParent(n, uf.find(p))
        }
      }
    }
  }

  const seen = new Set();
  for (const e of graph.edges()) {
    const anchoredEdge = [uf.find(e.v), uf.find(e.w)];
    const key = anchoredEdge.join('->');
    if (seen.has(key)) continue;
    seen.add(key);
    if (anchoredEdge[0] !== anchoredEdge[1]) {
      addNode(anchoredEdge[0]);
      addNode(anchoredEdge[1]);
      collapsedGraph.setEdge(anchoredEdge[0], anchoredEdge[1], { label: "" })
    }
  }

  const collapsedNodes = new Set<string>(Object.values(uf.parent))
  for (const n of collapsedNodes) {
    if (!collapsedGraph.hasNode(n)) {
      addNode(n);
    }
  }
  
  collapsedGraph.removeNode('ROOT');
  return collapsedGraph;
}
    
/**
 * Return nodes reachable from the given seed nodeIds. 
 */
export function depthLimitedTraversal(
  graph: Graph,
  seeds: string[], // seed node ids
  relations: Array<'parent'|'children'|'predecessors'|'successors'>,
  depth: number = -1, // -1 means no limit
  exact: boolean = false // only return nodes at the exact depth, not the closure up to that depth
): Set<string> {
  if (seeds.length === 0) {
    return new Set();
  }
  const visited = new Set(seeds);
  let frontier = [...seeds];
  const maxDepth = depth < 0 ? Infinity : depth;

  for (let d = 1; d <= maxDepth && frontier.length; d++) {
    const next = []
    for (const n of frontier) {
      for (const rel of relations) {
        const neighbors = rel === 'parent'
                ? [graph.parent(n)].filter((x): x is string => !!x)
                : graph[rel](n) || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            next.push(n);
          }
        }
      }
    }
    frontier = next;
    if (exact && d === depth) {
      return new Set(frontier);
    }
  }
  return exact ? new Set(frontier) : visited;
}


/*
 * Induce a subgraph closure for a given set of node Ids.
 * The resulting graph includes every edge (v->w) where both v and w are in nodeIds
 * AND, includes any parent relationship (v.parent == w) where both v and w are in nodeIds.
 */
export function induceCompoundSubgraph(graph: Graph, nodeIds: Set<string>): Graph {
  const sub = new Graph({ directed: true, compound: true });
  sub.setGraph(graph.graph());
  nodeIds.forEach(id => {
    if (graph.hasNode(id)) {
      sub.setNode(id, graph.node(id));
    }
  })
  // graph.edges().forEach(edge => {
  //   if (nodeSet.has(edge.v) && nodeSet.has(edge.w)) {
  //     sub.setEdge(edge.v, edge.w, graph.edge(edge));
  //   }
  // });
  //
  // More efficient probably? The loop still hits each subgraph edge twice,
  // but that's probably faster than checking every edge in the graph.
  const seen = new Set();
  nodeIds.forEach(v => {
    (graph.nodeEdges(v) || []).forEach(e => {
      const u = e.v === v ? e.w : e.v;
      if (nodeIds.has(u)) {
        const key = `${e.v}->${e.w}`;
        if (!seen.has(key)) {
          seen.add(key);
          sub.setEdge(e.v, e.w, graph.edge(e));
        }
      }
    });
  });

  nodeIds.forEach(id => {
    const parent = graph.parent(id);
    if (parent && nodeIds.has(parent)) {
      sub.setParent(id, parent);
    }
  })
  return sub
}

/**
 * Transitive reduction: drop any edges u->v if there exists
 * an alternate path from u to v via other nodes.
 */
export function removeTransitiveEdges(graph: Graph): Graph {

  // 1) topological sort
  const topo: string[] = alg.topsort(graph);

  // 2) Build succ: map from node to direct successors
  const succ = new Map<string, string[]>();
  for (const u of graph.nodes()) {
    succ.set(u, graph.successors(u) || []);
  }

  // 3) Compute reachability sets in reverse topo order
  const reach = new Map<stirng, Set<string>>();
  for (let i = topo.length - 1; i >= 0; i--) {
    const u = topo[i]
    const r = new Set<string>();
    for (const w of succ.get(u)!) {
      r.add(w);
      const rw = reach.get(w);
      if (rw) for (const x of rw) r.add(x);
    }
    reach.set(u, r);
  }

  // 4) Build the new graph with only non-redundant edges
  const result = new Graph({ directed: true, compound: true });
  result.setGraph(graph.graph());
  for (const u of graph.nodes()) {
    result.setNode(u, graph.node(u));
    const p = graph.parent(u);
    if (p) result.setParent(u, p);
  }

  // 4b) Filter edges
  for (const e of graph.edges()) {
    const { v: u, w: v } = e;
    let isRedundant = false;
    for (const w of succ.get(u)!) {
      if (w !== v && reach.get(w)!.has(v)) {
        isRedundant = true;
        break;
      }
    }
    if (!isRedundant) {
      result.setEdge(u, v, graph.edge(e));
    }
  }
  return result;
}

