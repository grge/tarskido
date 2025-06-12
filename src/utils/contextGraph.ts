import { Graph } from '@dagrejs/graphlib';
import {
  depthLimitedTraversal,
  induceCompoundSubgraph,
  collapseHierarchy,
  removeTransitiveEdges
} from './graphUtils.ts';

function getAnchors(
  graph: Graph,
  contextIds: string[],
  options: { contextCollapseLevel?: number; outsideCollapseLevel?: number; }
): string[] {
  // This whole function is not very efficient... some of the traversals could be combined/avoided
  // The depth function should be a one-pass map, not a function, etc.
  function depth(n) { if (graph.parent(n)) return 1 + depth(graph.parent(n)); return 0; }
  const minDepth = contextIds.map(depth).reduce((a, b) => Math.min(a, b), Infinity);
  const contextAnchors = depthLimitedTraversal(graph, contextIds, ['children'], options.contextCollapseLevel);
  const rootNodes = graph.nodes().filter(n => !graph.parent(n));
  const outsideAnchors = depthLimitedTraversal(graph, rootNodes, ['children'], minDepth + options.outsideCollapseLevel, true);
  // We could remove this stage if we were able to reach inside the above depthLimitedTraversal, so there's room for refactoring...
  const contextDescendants = depthLimitedTraversal(graph, contextIds, ['children']);
  const cleanedOutsideAnchors = Array.from(outsideAnchors).filter(n => !contextDescendants.has(n));
  return new Set([...contextAnchors, ...cleanedOutsideAnchors])
}

function removeSingleChildRoots(
  graph: Graph,
  protectedIds: Set<string>
): Graph {
  const toRemove: string[] = []
  for (const n of graph.nodes()) {
    // 1) skip protected nodes
    if (protectedIds.has(n)) continue;
    // 2) skip if this node has a parent of its own
    if (graph.parent(n)) continue;
    // 3) skip if this node has multiple children
    const children = graph.children(n) || [];
    if (children.length !== 1) continue;
    toRemove.push(n);
  }
  for (const n of toRemove) {
    const [child] = graph.children(n) || [];
    graph.setParent(child, undefined);
    graph.removeNode(n);
  }
  return graph;
}

export interface contextGraphOptions {
  reduceEdges?: boolean;
  contextCollapseLevel?: number;
  outsideCollapseLevel?: number;
  predecessorRadius?: number;
  successorRadius?: number;
  includeParents?: boolean;
  prineSingleChildParents?: boolean;
}

export function buildContextGraph(
  graph: Graph,
  contextIds: string[] = [],
  options: contextGraphOptions = {}
) {
  const {
    reduceEdges = true,
    contextCollapseLevel = 1,
    outsideCollapseLevel = 0,
    predecessorRadius = 1,
    successorRadius = 1,
    includeParents = true,
    pruneSingleChildParents = true
  } = options;

  const contextSet = new Set(contextIds);
  // Step 1. Build set of seed nodes - all descendants of context nodes
  const seedNodes = depthLimitedTraversal(graph, contextSet, ['children']);

  // Step 2. Find the neighbourhood of nodes around the seedNodes
  const preds = depthLimitedTraversal(graph, seedNodes, ['predecessors'], predecessorRadius);
  const succs = depthLimitedTraversal(graph, seedNodes, ['successors'], successorRadius);
  const neighborhood = new Set([...preds, ...succs]);
  const neighborhoodWithAncesters = depthLimitedTraversal(graph, neighborhood, ['parent']);

  // Step 3. Induce subgraph on the neighbourhood (i.e., gather all the edges)
  let sub = induceCompoundSubgraph(graph, neighborhoodWithAncesters);

  // Step 4. Collapse clusters and rewire edges
  const collapseOpts = { contextCollapseLevel, outsideCollapseLevel }
  const anchorIds = new Set(getAnchors(sub, contextIds, collapseOpts));
  sub = collapseHierarchy(sub, anchorIds, includeParents);

  // Step 5. Optionally reduce transitive edges
  if (reduceEdges) { sub = removeTransitiveEdges(sub) }

  // Step 6. Optionally prune parents with single children (note, this one mutates the graph)
  if (pruneSingleChildParents) removeSingleChildRoots(sub, new Set(contextIds));

  return sub;
}
