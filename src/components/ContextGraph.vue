<template>
  <div class='context-graph'>

      <div class="measure-container" ref="measureRoot">
        <div v-for="id in allNodeIds" :key="id" :data-id="id" class="measure-node">
          <NodeReference :nodeId="id" :useName="true" />
        </div>
      </div>
      <svg
        :viewBox="`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`"
          :width="`${bbox.width}`"
          :height="`${bbox.height}`"
        preserveAspectRatio="xMidYMid meet"
        class="graph-svg">

        <defs>
          <filter id="sofGlow" height="300%" width="300%" x="-75%" y="-75%">
            <!-- Thicken out the original shape -->
            <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken" />
            <!-- Use a gaussian blur to create the soft blurriness of the glow -->
            <feGaussianBlur in="thicken" stdDeviation="10" result="blurred" />
            <!-- Change the colour -->
            <feFlood flood-color="rgb(255,229,153)" result="glowColor" />
            <!-- Color in the glows -->
            <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored" />
            <!--	Layer the effects together -->
            <feMerge>
              <feMergeNode in="softGlow_colored"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <marker id="arrowhead" markerWidth="8" markerHeight="8"
                  refX="8" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 7 z" fill="#444"/>
          </marker>
        </defs>

        <g class="cluster"
           v-for="id in clusters"
           :key="id"
           :transform="`translate(${subGraph.node(id).x - subGraph.node(id).width/2}, ${subGraph.node(id).y - subGraph.node(id).height/2})`">
          <rect :width="`${subGraph.node(id).width}`"
                :height="`${subGraph.node(id).height}`"
                :filter="contextIds.includes(id) ? 'url(#sofGlow)' : ''"
                fill="#eaeaea">
          </rect>
          <foreignObject :width="`${subGraph.node(id).width}`" :height="`${subGraph.node(id).height}`">
            <div xmlns="http://www.w3.org/1999/xhtml" class="cluster-reference">
              <NodeReference :nodeId="id" :useName="true"/>
            </div>
          </foreignObject>
        </g>

        <g class="node"
           v-for="id in leaves"
           :key="id"
           :transform="`translate(${subGraph.node(id).x - subGraph.node(id).width/2}, ${subGraph.node(id).y - subGraph.node(id).height/2})`">
        <rect :height="`${subGraph.node(id).height}`"
              :width="`${subGraph.node(id).width}`"
              :filter="(contextIds.includes(id) ? 'url(#sofGlow)' : '')"
              :class="`${book.nodes[id].nodetype.secondary == 'Chapter' ? 'chapter' : ''}`"
        </rect>
        <foreignObject :width="`${subGraph.node(id).width}`" :height="`${subGraph.node(id).height}`">
          <div xmlns="http://www.w3.org/1999/xhtml" class="node-content">
            <NodeReference :nodeId="id" :useName="true" />
          </div>
        </foreignObject>
        </g>

        <g class="edgePath" stroke='#444' fill="none">
          <path v-for="({ v, w }) in edges"
              :key="`${v}-${w}`"
              :d="edgeD(v, w)"
              marker-end="url(#arrowhead)"
              />
        </g>
      </svg>
  </div>
</template> 

<script setup lang="ts">
import { useBookStore } from '@/stores/bookshelf';
import { ref, computed, watch, nextTick } from 'vue';
import NodeReference from '@/components/NodeReference.vue'
import dagre from 'dagre';
import Graph from '@/graphlib_ext.js'

const props = defineProps<{ contextIds: string[] }>();
const store = useBookStore();

const fullGraph = computed(() => store.graph);
const book = computed(() => store.rawBook);
const rawSubGraph = computed(() => buildContextSubGraph(fullGraph.value, props.contextIds));
const readyForLayout = ref(false);
const nodeSizes = ref<{ [key: string]: { width: number, height: number } }>({});

const allNodeIds = computed(() => rawSubGraph.value.nodes());

const measureRoot = ref<HTMLElement | null>(null);
async function measureNodeSizes() {
  await nextTick();

  const divs = measureRoot.value!.querySelectorAll('.measure-node');
  const newSizes: typeof nodeSizes.value = {};
  divs.forEach(div => {
    const id = div.getAttribute('data-id');
    if (!id) return;
    const rect = div.getBoundingClientRect();
    newSizes[id] = { width: rect.width, height: rect.height };
  })
  nodeSizes.value = newSizes;
  readyForLayout.value = true;
}

function edgeD(v:string, w:string) {
  const edge = subGraph.value.edge(v, w);
  if (!edge) return '';
  const pts = edge.points;
  return 'M' + pts.map(p => `${p.x},${p.y}`).join('L');
};

function buildContextSubGraph(graph: Graph, contextIds: string[] = []){
  // our context sub graph will show all of the relationships involving "relevant" nodes
  // although some of those nodes may be collapsed clusters.
  function descendants(n: string) {
    return [n, ...graph.children(n).flatMap((child) => [...graph.descendants(child), child])];
  }

  // relevant nodes are those that are either in the contextIds or are descendants of a contextId
  const relevantNodes = [... new Set(contextIds.map(descendants).flat())];
  const relevantEdges = relevantNodes.flatMap((n) => graph.nodeEdges(n)).map((obj) => [obj.v, obj.w]);

  // Their may be extra edges that connect nodes that are incident to a relevantEdge but are not themselves
  // relevantNodes, so we need to do a bit of extra work to include those.
  const newNodes = relevantEdges.flatMap(([v, w]) => [v, w]).filter((n) => !relevantNodes.includes(n));
  const newEdges = newNodes.flatMap((n) => graph.nodeEdges(n))
                           .map((obj) => [obj.v, obj.w])
                           .filter(([v, w]) => (newNodes.includes(v) && newNodes.includes(w)));

  const combinedEdges = relevantEdges.concat(newEdges);

  // To be displayed a node must be part of a relevant edge *and* be an anchor node
  // an anchor is either a context node, or a child or a sibling of a context node
  // This is the step that collapses clusters. I.e., each node incident to combinedEdges
  // gets rolled up into an anchor node.
  const contextChildren = contextIds.flatMap((n) => graph.children(n));
  const contextSiblings = contextIds.flatMap((id) => graph.parent(id) ? graph.children(graph.parent(id)) : []);
  const anchors = [... new Set([...contextChildren, ...contextSiblings])];

  // now we map each relevant edge's endpoints to the nearst anchor by tracing up the parent hierarchy
  // for efficiency, we construct construct a node -> anchor map to use as a cache as we go
  const nodeAnchorMap = {};
  const anchoredEdges = [];

  // Now we need to map all of the edges to be edges between anchors
  for (const [v, w] of combinedEdges) {
    const seen = new Set();
    for (const orig of [v, w]) {
      let n = orig;
      if (!nodeAnchorMap[n]) {
        while (n && !anchors.includes(n)) {
          n = graph.parent(n);
        }
        // if we didn't find an anchor, just use the node itself
        nodeAnchorMap[orig] = n || orig;
      }
    }
    const anchoredEdge = [nodeAnchorMap[v], nodeAnchorMap[w]];
    const key = anchoredEdge.join('-');
    if (seen.has(key)) continue;
    seen.add(key);
    // When we collapse a cluster, all of the cluster's internal edges become self-loops
    // so we explicitly skip those.
    if (anchoredEdge[0] === anchoredEdge[1]) continue; 
    anchoredEdges.push(anchoredEdge);
  }

  // now we build the graph
  const subGraph = new Graph({ directed: true, compound: true });
  subGraph.setGraph({ rankdir: 'LR' });
  const addNode = (n : string) => {
    if (graph.hasNode(n) && !subGraph.hasNode(n)) {
      subGraph.setNode(n, graph.nodes(n));
      subGraph.setParent(n, graph.parent(n));
    }
  }

  contextIds.forEach(addNode);
  contextChildren.forEach(addNode);
  anchoredEdges.forEach(([v, w]) => {
    addNode(v);
    addNode(w);
    subGraph.setEdge(v, w, {label: ""});
  });
  subGraph.removeNode('ROOT');
  return subGraph;
}

watch(rawSubGraph, (sg) => {
  readyForLayout.value = false;
  measureNodeSizes();
}, {
  immediate: true,
})

const subGraph = ref(new Graph({ directed: true, compound: true }));
subGraph.value.setGraph({ rankdir: 'LR' });

watch(readyForLayout, (ready) => {
  if (!ready) return
  const g = rawSubGraph.value
  g.nodes().forEach( id => {
    const size = nodeSizes.value[id];
    if (size) {
      g.setNode(id, { width: size.width + 20, height: size.height });
    }
  })
  dagre.layout(g)
  subGraph.value = g
})


const bbox = computed(() => {
  const sg = subGraph.value
  const ids = sg.nodes()
  if (!ids.length) {
    return { minX: 0, minY: 0, width: 0, height: 0 }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  ids.forEach(id => {
    const { x, y, width, height } = sg.node(id)!
    const left   = x - width  / 2 - 20
    const right  = x + width  / 2 + 20
    const top    = y - height / 2 - 20
    const bottom = y + height / 2 + 20

    minX = Math.min(minX, left)
    maxX = Math.max(maxX, right)
    minY = Math.min(minY, top)
    maxY = Math.max(maxY, bottom)
  })

  return {
    minX,
    minY,
    width:  maxX - minX,
    height: maxY - minY
  }
})

const nodes = computed(() => subGraph.value.nodes())
const edges = computed(() => subGraph.value.edges())
const clusters = computed(() => nodes.value.filter((n) => (subGraph.value.children(n).length > 0)))
const leaves = computed(() => nodes.value.filter((n) => (subGraph.value.children(n).length == 0)))

</script>

<style>

.measure-container {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  z-index: 1;
  width: max-content;
  height: auto;
}

.measure-node {
  position: relative;
  display: inline-block;
  width: auto;
  padding: 7px;
  height: auto;
  box-sizing: border-box;
}

.context-graph {
  display: flex;
  justify-content: center;
  overflow-x: display;
}

.graph-svg {
  flex-shrink: 0;
  width: auto;
  height: auto;
}

g.node rect {
    rx: 5px;
    ry: 5px;
    fill: white;
    stroke: #888;
    stroke-width:1.5px;
}

g.node rect.chapter {
    fill: #f8f8f8;
    stroke: #ff9900;
    stroke-width: 2px;
}

g.node div {
  padding: 6px;
  padding-left: 10px;
}

g.cluster rect {
    fill: #f8f8f8;
    stroke: #ff9900;
    stroke-width: 2px;
}

.edgePath {
    stroke: #333;
    stroke-width: 1.5px;
}

.cluster-reference {
  font-size: 0.8em;
  padding: 0.4em 1em;
  color: #333;
}

</style>
