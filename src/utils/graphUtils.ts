import { Graph, alg } from '@dagrejs/graphlib';

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
      return x;
    }
    const p = this.parent.get(x);
    if (p !== x && p !== undefined) {
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
 * Detect which anchor nodes (chapters) participate in dependency cycles.
 * Returns both the set of cyclic anchors and the cycle information for UI feedback.
 */
export function detectCyclicChapters(
  graph: Graph,
  anchorIds: Set<string>
): {
  cyclicAnchors: Set<string>;
  cycles: string[][];
  chapterEdges: Map<string, Set<string>>;
} {
  console.log('🔍 CYCLE DETECTION: Starting analysis...');
  
  const uf = new UnionFind(graph.nodes());
  
  // First, determine what each node would collapse to
  for (const n of graph.nodes()) {
    if (!anchorIds.has(n)) {
      let cur: string | undefined = n;
      while (cur) {
        const p = graph.parent(cur);
        if (!p) break;
        if (anchorIds.has(p)) {
          uf.union(n, p);
          break;
        }
        cur = p;
      }
    }
  }
  
  // Build chapter-to-chapter graph
  const chapterGraph = new Graph({ directed: true });
  const chapterEdges = new Map<string, Set<string>>();
  
  // Add anchor nodes (excluding ROOT)
  for (const anchor of anchorIds) {
    if (anchor !== 'ROOT') {
      chapterGraph.setNode(anchor, {});
      chapterEdges.set(anchor, new Set());
    }
  }
  
  // Build chapter-to-chapter edges
  const seen = new Set();
  for (const e of graph.edges()) {
    const anchoredEdge = [uf.find(e.v), uf.find(e.w)];
    const key = anchoredEdge.join('->');
    if (seen.has(key)) continue;
    seen.add(key);
    
    if (anchoredEdge[0] !== anchoredEdge[1] && 
        anchoredEdge[0] !== 'ROOT' && 
        anchoredEdge[1] !== 'ROOT') {
      
      const [from, to] = anchoredEdge;
      chapterGraph.setEdge(from, to, {});
      chapterEdges.get(from)?.add(to);
    }
  }
  
  // Detect cycles using graphlib
  const cycles = alg.findCycles(chapterGraph);
  const cyclicAnchors = new Set<string>();
  
  console.log(`🔍 CYCLE DETECTION: Found ${cycles.length} cycles`);
  for (let i = 0; i < cycles.length; i++) {
    const cycle = cycles[i];
    console.log(`  Cycle ${i + 1}: ${cycle.join(' → ')}`);
    for (const node of cycle) {
      cyclicAnchors.add(node);
    }
  }
  
  console.log(`🎯 CYCLE DETECTION: ${cyclicAnchors.size} chapters affected:`, [...cyclicAnchors]);
  
  return { cyclicAnchors, cycles, chapterEdges };
}

/**
 * Collapse clusters in the compound graph. Returns the new graph.
 * Any node that is a descendant of an anchor node (in the anchorIds set) will be collapsed,
 * and the edge relationships will be rewired accordingly.
 * What is the behavoiur when an anchor node is a descendant of another anchor node?
 * Your guess is as good as mine.
 */
export function collapseHierarchy(
  graph: Graph,
  anchorIds: Set<string>,
  includeParents: boolean = true
): {
  graph: Graph;
  cycles: string[][];
  chapterEdges: Map<string, Set<string>>;
} {
  console.log('🔄 Starting collapseHierarchy...');
  console.log(`📊 Input: ${graph.nodes().length} nodes, ${graph.edges().length} edges`);
  console.log(`🎯 Anchors:`, [...anchorIds]);

  // Detect cycles first
  const { cyclicAnchors, cycles, chapterEdges } = detectCyclicChapters(graph, anchorIds);
  
  const uf = new UnionFind(graph.nodes());
  for (const n of graph.nodes()) {
    if (!anchorIds.has(n)) {
      let cur: string | undefined = n;
      while (cur) {
        const p = graph.parent(cur);
        if (!p) break;
        if (anchorIds.has(p) && !cyclicAnchors.has(p)) {
          // Only collapse chapters that don't participate in cycles
          uf.union(n, p);
          break;
        }
        cur = p;
      }
    }
  }
  const collapsedGraph = new Graph({ directed: true, compound: true });
  collapsedGraph.setGraph(graph.graph());
  const addNode = (n: string) => {
    collapsedGraph.setNode(n, graph.node(n));
    if (includeParents) {
      const p = graph.parent(n);
      if (p) {
        collapsedGraph.setParent(n, uf.find(p));
      }
    }
  };

  const addedEdges = new Set<string>();

  const seen = new Set();
  for (const e of graph.edges()) {
    const anchoredEdge = [uf.find(e.v), uf.find(e.w)];
    const key = anchoredEdge.join('->');
    if (seen.has(key)) continue;
    seen.add(key);
    if (anchoredEdge[0] !== anchoredEdge[1]) {
      addNode(anchoredEdge[0]);
      addNode(anchoredEdge[1]);
      collapsedGraph.setEdge(anchoredEdge[0], anchoredEdge[1], { label: '' });
      
      addedEdges.add(`${anchoredEdge[0]} → ${anchoredEdge[1]}`);
    }
  }

  // TODO: This is probably not what we really want...
  // But this ensures we get all the nodes in the graph,
  // AND that we get their correct parent relationship.
  const collapsedNodes = new Set<string>(uf.parent.values());
  for (const n of collapsedNodes) {
    addNode(n);
  }

  collapsedGraph.removeNode('ROOT');

  console.log('🔗 Final edges created:', [...addedEdges]);
  console.log(`✅ Output: ${collapsedGraph.nodes().length} nodes, ${collapsedGraph.edges().length} edges`);
  
  if (cycles.length > 0) {
    console.log(`🚨 Selective collapse applied - ${cyclicAnchors.size} chapters left uncollapsed due to cycles`);
  }

  return { graph: collapsedGraph, cycles, chapterEdges };
}

/**
 * Return nodes reachable from the given seed nodeIds.
 */
export function depthLimitedTraversal(
  graph: Graph,
  seeds: string[], // seed node ids
  relations: Array<'parent' | 'children' | 'predecessors' | 'successors'>,
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
    const next = [];
    for (const n of frontier) {
      for (const rel of relations) {
        const neighbors =
          rel === 'parent'
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
  });
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
  });
  return sub;
}

/**
 * Transitive reduction: drop any edges u->v if there exists
 * an alternate path from u to v via other nodes.
 */
export function removeTransitiveEdges(graph: Graph): Graph {
  // 1) topological sort
  console.log('🔍 TOPSORT DEBUG: About to run topological sort...');
  console.log(`📊 Graph has ${graph.nodes().length} nodes, ${graph.edges().length} edges`);
  console.log(`📋 Nodes:`, graph.nodes());
  console.log(`🔗 Edges:`, graph.edges().map(e => `${e.v}→${e.w}`));
  
  try {
    const isAcyclic = alg.isAcyclic(graph);
    console.log(`🔄 Graph is acyclic: ${isAcyclic}`);
    
    if (!isAcyclic) {
      const cycles = alg.findCycles(graph);
      console.log('❌ CYCLES DETECTED in removeTransitiveEdges:', cycles);
      throw new Error(`Graph has cycles: ${JSON.stringify(cycles)}`);
    }
    
    const topo: string[] = alg.topsort(graph);
    console.log('✅ Topological sort successful');
  } catch (error) {
    console.error('❌ TOPOLOGICAL SORT FAILED:', error);
    console.log('Graph nodes:', graph.nodes());
    console.log('Graph edges:', graph.edges().map(e => `${e.v} → ${e.w}`));
    throw error;
  }
  const topo: string[] = alg.topsort(graph);

  // 2) Build succ: map from node to direct successors
  const succ = new Map<string, string[]>();
  for (const u of graph.nodes()) {
    succ.set(u, graph.successors(u) || []);
  }

  // 3) Compute reachability sets in reverse topo order
  const reach = new Map<string, Set<string>>();
  for (let i = topo.length - 1; i >= 0; i--) {
    const u = topo[i];
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

/**
 * Creates a deep copy of a graph by filtering all nodes (effectively copying everything)
 * This is more descriptive than the original .copy() method
 */
export function cloneGraph(graph: Graph): Graph {
  return graph.filterNodes(() => true);
}
