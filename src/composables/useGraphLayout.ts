import { ref, watch, nextTick, computed, type Ref } from 'vue';

import dagre from 'dagre';
import { Graph } from '@dagrejs/graphlib';

interface LayoutOptions {
  padding?: number;
  nodeMargin?: number;
}

/**
 * Encapsulates: measuring node dimensions, running dagre.layout,
 * and computing the SVG bounding box.
 */
export function useGraphLayout(
  rawGraph: Ref<Graph>,
  measureRoot: Ref<HTMLElement|null>,
  opts: LayoutOptions = {}
) {
  const { padding = 20, nodeMargin = 20 } = opts

  const graph = ref<Graph>(new Graph({ directed: true, compound: true }))

  const bbox = computed(() => {
    const g = graph.value
    const ids = g.nodes()
    if (!ids.length) return { minX:0, minY:0, width:0, height:0 }
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity
    for (const id of ids) {
      const { x, y, width, height } = g.node(id)!
      const left   = x - width/2 - padding
      const right  = x + width/2 + padding
      const top    = y - height/2 - padding
      const bottom = y + height/2 + padding
      minX = Math.min(minX, left)
      minY = Math.min(minY, top)
      maxX = Math.max(maxX, right)
      maxY = Math.max(maxY, bottom)
    }
    return { minX, minY, width: maxX-minX, height: maxY-minY }
  })

  watch(rawGraph, async (g) => {
    await nextTick()
    const root = measureRoot.value
    if (root) {
      const sizes: Record<string,{width:number,height:number}> = {}
      root.querySelectorAll<HTMLElement>('.measure-node').forEach(el => {
        const id = el.dataset.id!
        const r = el.getBoundingClientRect()
        sizes[id] = { width: r.width + nodeMargin, height: r.height }
      })
      const layoutGraph = g.copy().setGraph({ rankdir:'LR' })
      layoutGraph.nodes().forEach(id => {
        const s = sizes[id]
        if (s) layoutGraph.setNode(id, { width: s.width, height: s.height })
      })
      dagre.layout(layoutGraph)
      graph.value = layoutGraph
    }
  }, { immediate: true })

  return { graph, bbox }
}
