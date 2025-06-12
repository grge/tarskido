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
import { buildContextGraph } from '@/utils/contextGraph.ts';
import NodeReference from '@/components/NodeReference.vue'
import dagre from 'dagre';
import Graph from '@/graphlib_ext.js'

const props = defineProps<{ contextIds: string[] }>();
const store = useBookStore();

const fullGraph = computed(() => store.graph);
const book = computed(() => store.rawBook);
const rawSubGraph = computed(() => {
  const g = buildContextGraph(fullGraph.value, props.contextIds);
  g.removeNode("ROOT")
  return g;
});
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
  width: 80vw;
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
  flex-direction: column;
  align-items: center;
  height: auto;
  overflow-x: scroll;
  margin-top: 1em;
}

.graph-svg {
  height: auto;
  max-width: 90vw;
  overflow: visible;
  display: block;
  justify-content: center;
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
