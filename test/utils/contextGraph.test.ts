import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from '@dagrejs/graphlib';
import { buildContextGraph } from '../../src/utils/contextGraph';

describe('contextGraph', () => {
  describe('buildContextGraph', () => {
    let graph: Graph;

    beforeEach(() => {
      graph = new Graph({ directed: true, compound: true });
      graph.setGraph({ label: 'test' });
    });

    it('should handle empty graph', () => {
      const result = buildContextGraph(graph, []);
      expect(result.graph.nodes()).toEqual([]);
      expect(result.graph.edges()).toEqual([]);
    });

    it('should handle empty context', () => {
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setEdge('A', 'B', {});

      const result = buildContextGraph(graph, []);
      expect(result.graph.nodes()).toEqual([]);
      expect(result.graph.edges()).toEqual([]);
    });

    it('should include context nodes and their immediate neighborhood', () => {
      // Create simple chain: A -> B -> C
      graph.setNode('A', { label: 'A' });
      graph.setNode('B', { label: 'B' });
      graph.setNode('C', { label: 'C' });
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});

      const result = buildContextGraph(graph, ['B']);

      // Should include B and its immediate neighbors
      expect(result.graph.hasNode('A')).toBe(true);
      expect(result.graph.hasNode('B')).toBe(true);
      expect(result.graph.hasNode('C')).toBe(true);
      expect(result.graph.hasEdge('A', 'B')).toBe(true);
      expect(result.graph.hasEdge('B', 'C')).toBe(true);
    });

    it('should respect predecessor radius', () => {
      // Create chain: A -> B -> C -> D -> E
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setNode('E', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});
      graph.setEdge('C', 'D', {});
      graph.setEdge('D', 'E', {});

      const result = buildContextGraph(graph, ['C'], { predecessorRadius: 2, successorRadius: 0 });

      // Should include C and 2 predecessors (B, A), but no successors
      expect(result.graph.hasNode('A')).toBe(true);
      expect(result.graph.hasNode('B')).toBe(true);
      expect(result.graph.hasNode('C')).toBe(true);
      expect(result.graph.hasNode('D')).toBe(false);
      expect(result.graph.hasNode('E')).toBe(false);
    });

    it('should respect successor radius', () => {
      // Create chain: A -> B -> C -> D -> E
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setNode('E', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});
      graph.setEdge('C', 'D', {});
      graph.setEdge('D', 'E', {});

      const result = buildContextGraph(graph, ['C'], { predecessorRadius: 0, successorRadius: 2 });

      // Should include C and 2 successors (D, E), but no predecessors
      expect(result.graph.hasNode('A')).toBe(false);
      expect(result.graph.hasNode('B')).toBe(false);
      expect(result.graph.hasNode('C')).toBe(true);
      expect(result.graph.hasNode('D')).toBe(true);
      expect(result.graph.hasNode('E')).toBe(true);
    });

    it('should disable edge reduction when requested', () => {
      // Create: A -> B -> C with transitive edge A -> C
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('B', 'C', {});
      graph.setEdge('A', 'C', {}); // transitive edge

      const resultWithReduction = buildContextGraph(graph, ['B'], { reduceEdges: true });
      const resultWithoutReduction = buildContextGraph(graph, ['B'], { reduceEdges: false });

      // With reduction, transitive edge should be removed
      expect(resultWithReduction.graph.hasEdge('A', 'C')).toBe(false);
      // Without reduction, transitive edge should remain
      expect(resultWithoutReduction.graph.hasEdge('A', 'C')).toBe(true);
    });

    it('should handle multiple context nodes', () => {
      // Create: A -> B, C -> D
      graph.setNode('A', {});
      graph.setNode('B', {});
      graph.setNode('C', {});
      graph.setNode('D', {});
      graph.setEdge('A', 'B', {});
      graph.setEdge('C', 'D', {});

      const result = buildContextGraph(graph, ['A', 'C']);

      // Should include both context nodes and their neighborhoods
      expect(result.graph.hasNode('A')).toBe(true);
      expect(result.graph.hasNode('B')).toBe(true);
      expect(result.graph.hasNode('C')).toBe(true);
      expect(result.graph.hasNode('D')).toBe(true);
      expect(result.graph.hasEdge('A', 'B')).toBe(true);
      expect(result.graph.hasEdge('C', 'D')).toBe(true);
    });

    it('should preserve node attributes', () => {
      graph.setNode('A', { label: 'Node A', type: 'definition' });
      graph.setNode('B', { label: 'Node B', type: 'theorem' });
      graph.setEdge('A', 'B', {});

      const result = buildContextGraph(graph, ['A']);

      expect(result.graph.node('A')).toEqual({ label: 'Node A', type: 'definition' });
      expect(result.graph.node('B')).toEqual({ label: 'Node B', type: 'theorem' });
    });
  });
});
