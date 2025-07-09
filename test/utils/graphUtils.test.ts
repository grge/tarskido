import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from '@dagrejs/graphlib';
import {
  collapseHierarchy,
  depthLimitedTraversal,
  induceCompoundSubgraph,
  removeTransitiveEdges,
} from '../../src/utils/graphUtils';

describe('graphUtils', () => {
  describe('UnionFind (via collapseHierarchy)', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph({ directed: true, compound: true });
    });

    it('should handle empty graph', () => {
      const result = collapseHierarchy(graph, new Set());
      expect(result.nodes()).toEqual([]);
      expect(result.edges()).toEqual([]);
    });

    it('should collapse simple hierarchy', () => {
      // Create: ROOT -> A -> B -> C
      graph.setNode('ROOT', {});
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setParent('A', 'ROOT');
      graph.setParent('B', 'A');
      graph.setParent('C', 'B');
      graph.setEdge('A', 'B', { label: '' });
      graph.setEdge('B', 'C', { label: '' });

      const result = collapseHierarchy(graph, new Set(['A']));

      // A should be the anchor, B and C should be collapsed into A
      expect(result.hasNode('A')).toBe(true);
      expect(result.hasNode('B')).toBe(false);
      expect(result.hasNode('C')).toBe(false);
      expect(result.edges()).toEqual([]);
    });

    it('should handle multiple anchors', () => {
      // Create: ROOT -> A -> B, ROOT -> C -> D
      graph.setNode('ROOT', {});
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setParent('A', 'ROOT');
      graph.setParent('B', 'A');
      graph.setParent('C', 'ROOT');
      graph.setParent('D', 'C');
      graph.setEdge('A', 'C', { label: '' });
      graph.setEdge('B', 'D', { label: '' });

      const result = collapseHierarchy(graph, new Set(['A', 'C']));

      // Both A and C should remain as anchors
      expect(result.hasNode('A')).toBe(true);
      expect(result.hasNode('C')).toBe(true);
      expect(result.hasNode('B')).toBe(false);
      expect(result.hasNode('D')).toBe(false);
      expect(result.hasEdge('A', 'C')).toBe(true);
    });

    it('should preserve edges between collapsed nodes', () => {
      graph.setNode('ROOT', {});
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setParent('B', 'A');
      graph.setParent('C', 'A');
      graph.setEdge('B', 'C', { label: '' });

      const result = collapseHierarchy(graph, new Set(['A']));

      // Edge should be collapsed to self-loop and removed
      expect(result.hasNode('A')).toBe(true);
      expect(result.hasNode('B')).toBe(false);
      expect(result.hasNode('C')).toBe(false);
      expect(result.edges()).toEqual([]);
    });
  });

  describe('depthLimitedTraversal', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph({ directed: true, compound: true });
      // Create a simple DAG: A -> B -> C -> D
      //                      \-> E -> F
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setNode('E', {});
      graph.setNode('F', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});
      graph.setEdge('C', 'D', {});
      graph.setEdge('A', 'E', {});
      graph.setEdge('E', 'F', {});
    });

    it('should handle empty seeds', () => {
      const result = depthLimitedTraversal(graph, [], ['successors']);
      expect(result.size).toBe(0);
    });

    it('should traverse successors with no depth limit', () => {
      const result = depthLimitedTraversal(graph, ['A'], ['successors']);
      expect(result).toEqual(new Set(['A', 'B', 'C', 'D', 'E', 'F']));
    });

    it('should respect depth limit', () => {
      const result = depthLimitedTraversal(graph, ['A'], ['successors'], 2);
      expect(result).toEqual(new Set(['A', 'B', 'E', 'C', 'F']));
    });

    it('should return exact depth nodes when exact=true', () => {
      const result = depthLimitedTraversal(graph, ['A'], ['successors'], 2, true);
      expect(result).toEqual(new Set(['C', 'F']));
    });

    it('should traverse predecessors', () => {
      const result = depthLimitedTraversal(graph, ['D'], ['predecessors']);
      expect(result).toEqual(new Set(['D', 'C', 'B', 'A']));
    });

    it('should handle multiple relations', () => {
      const result = depthLimitedTraversal(graph, ['B'], ['predecessors', 'successors'], 1);
      expect(result).toEqual(new Set(['B', 'A', 'C']));
    });

    it('should handle compound graph with parent relations', () => {
      graph.setParent('B', 'A');
      graph.setParent('C', 'A');

      const result = depthLimitedTraversal(graph, ['B'], ['parent'], 1);
      expect(result).toEqual(new Set(['B', 'A']));
    });
  });

  describe('induceCompoundSubgraph', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph({ directed: true, compound: true });
      graph.setGraph({ label: 'test' });
      // Create: A -> B -> C, D -> E
      graph.setNode('A', { label: 'A' });
      graph.setNode('B', { label: 'B' });
      graph.setNode('C', { label: 'C' });
      graph.setNode('D', { label: 'D' });
      graph.setNode('E', { label: 'E' });
      graph.setEdge('A', 'B', { weight: 1 });
      graph.setEdge('B', 'C', { weight: 2 });
      graph.setEdge('D', 'E', { weight: 3 });
    });

    it('should induce subgraph with selected nodes', () => {
      const result = induceCompoundSubgraph(graph, new Set(['A', 'B']));

      expect(result.hasNode('A')).toBe(true);
      expect(result.hasNode('B')).toBe(true);
      expect(result.hasNode('C')).toBe(false);
      expect(result.hasEdge('A', 'B')).toBe(true);
      expect(result.hasEdge('B', 'C')).toBe(false);
      expect(result.edge('A', 'B')).toEqual({ weight: 1 });
    });

    it('should preserve node attributes', () => {
      const result = induceCompoundSubgraph(graph, new Set(['A', 'B']));

      expect(result.node('A')).toEqual({ label: 'A' });
      expect(result.node('B')).toEqual({ label: 'B' });
    });

    it('should preserve graph attributes', () => {
      const result = induceCompoundSubgraph(graph, new Set(['A', 'B']));

      expect(result.graph()).toEqual({ label: 'test' });
    });

    it('should handle parent-child relationships', () => {
      graph.setParent('B', 'A');
      graph.setParent('C', 'A');

      const result = induceCompoundSubgraph(graph, new Set(['A', 'B', 'C']));

      expect(result.parent('B')).toBe('A');
      expect(result.parent('C')).toBe('A');
    });

    it('should skip parent relationships when parent not in subgraph', () => {
      graph.setParent('B', 'A');

      const result = induceCompoundSubgraph(graph, new Set(['B']));

      expect(result.parent('B')).toBeUndefined();
    });

    it('should handle empty node set', () => {
      const result = induceCompoundSubgraph(graph, new Set());

      expect(result.nodes()).toEqual([]);
      expect(result.edges()).toEqual([]);
    });
  });

  describe('removeTransitiveEdges', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph({ directed: true, compound: true });
      graph.setGraph({ label: 'test' });
    });

    it('should remove simple transitive edge', () => {
      // Create: A -> B -> C, A -> C (transitive)
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setEdge('A', 'B', { weight: 1 });
      graph.setEdge('B', 'C', { weight: 2 });
      graph.setEdge('A', 'C', { weight: 3 }); // This should be removed

      const result = removeTransitiveEdges(graph);

      expect(result.hasEdge('A', 'B')).toBe(true);
      expect(result.hasEdge('B', 'C')).toBe(true);
      expect(result.hasEdge('A', 'C')).toBe(false);
    });

    it('should preserve direct edges without alternate paths', () => {
      // Create: A -> B, A -> C (both direct, no transitive)
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setEdge('A', 'B', { weight: 1 });
      graph.setEdge('A', 'C', { weight: 2 });

      const result = removeTransitiveEdges(graph);

      expect(result.hasEdge('A', 'B')).toBe(true);
      expect(result.hasEdge('A', 'C')).toBe(true);
    });

    it('should handle diamond pattern', () => {
      // Create: A -> B -> D, A -> C -> D, A -> D (transitive)
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('A', 'C', {});
      graph.setEdge('B', 'D', {});
      graph.setEdge('C', 'D', {});
      graph.setEdge('A', 'D', {}); // This should be removed

      const result = removeTransitiveEdges(graph);

      expect(result.hasEdge('A', 'B')).toBe(true);
      expect(result.hasEdge('A', 'C')).toBe(true);
      expect(result.hasEdge('B', 'D')).toBe(true);
      expect(result.hasEdge('C', 'D')).toBe(true);
      expect(result.hasEdge('A', 'D')).toBe(false);
    });

    it('should preserve node and edge attributes', () => {
      graph.setNode('A', { label: 'A' });
      graph.setNode('B', { label: 'B' });
      graph.setEdge('A', 'B', { weight: 1 });

      const result = removeTransitiveEdges(graph);

      expect(result.node('A')).toEqual({ label: 'A' });
      expect(result.node('B')).toEqual({ label: 'B' });
      expect(result.edge('A', 'B')).toEqual({ weight: 1 });
    });

    it('should preserve parent-child relationships', () => {
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setParent('B', 'A');

      const result = removeTransitiveEdges(graph);

      expect(result.parent('B')).toBe('A');
    });

    it('should handle empty graph', () => {
      const result = removeTransitiveEdges(graph);

      expect(result.nodes()).toEqual([]);
      expect(result.edges()).toEqual([]);
    });

    it('should handle single node', () => {
      graph.setNode('A', {});

      const result = removeTransitiveEdges(graph);

      expect(result.nodes()).toEqual(['A']);
      expect(result.edges()).toEqual([]);
    });

    it('should handle complex transitive chain', () => {
      // Create: A -> B -> C -> D -> E with transitive edges A->C, A->D, B->D, B->E
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setNode('E', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});
      graph.setEdge('C', 'D', {});
      graph.setEdge('D', 'E', {});
      // Add transitive edges
      graph.setEdge('A', 'C', {}); // A->B->C
      graph.setEdge('A', 'D', {}); // A->B->C->D
      graph.setEdge('B', 'D', {}); // B->C->D
      graph.setEdge('B', 'E', {}); // B->C->D->E

      const result = removeTransitiveEdges(graph);

      // Only direct edges should remain
      expect(result.hasEdge('A', 'B')).toBe(true);
      expect(result.hasEdge('B', 'C')).toBe(true);
      expect(result.hasEdge('C', 'D')).toBe(true);
      expect(result.hasEdge('D', 'E')).toBe(true);
      // Transitive edges should be removed
      expect(result.hasEdge('A', 'C')).toBe(false);
      expect(result.hasEdge('A', 'D')).toBe(false);
      expect(result.hasEdge('B', 'D')).toBe(false);
      expect(result.hasEdge('B', 'E')).toBe(false);
    });
  });
});
