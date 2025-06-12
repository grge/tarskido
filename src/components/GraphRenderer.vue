
<template>
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

    <TransitionGroup name="cluster" tag="g" class="clusters">
      <g class="cluster"
          v-for="id in clusters"
          :key="id"
          :transform="nodeTransform(id)">
        <rect :width="`${graph.node(id).width}`"
              :height="`${graph.node(id).height}`"
              :filter="highlightIds.includes(id) ? 'url(#sofGlow)' : ''"
              fill="#eaeaea">
        </rect>
        <foreignObject :width="`${graph.node(id).width}`" :height="`${graph.node(id).height}`">
          <div xmlns="http://www.w3.org/1999/xhtml" class="cluster-reference">
            <NodeReference :nodeId="id" :useName="true"/>
          </div>
        </foreignObject>
      </g>
    </TransitionGroup>

    <TransitionGroup name="node" tag="g" class="nodes">
      <g class="node"
          v-for="id in leaves"
          :key="id"
          :transform="nodeTransform(id)">
        <rect :height="`${graph.node(id).height}`"
              :width="`${graph.node(id).width}`"
              :filter="(highlightIds.includes(id) ? 'url(#sofGlow)' : '')"
              :class="`${book.nodes[id].nodetype.secondary == 'Chapter' ? 'chapter' : ''}`"
        </rect>
        <foreignObject :width="`${graph.node(id).width}`" :height="`${graph.node(id).height}`">
          <div xmlns="http://www.w3.org/1999/xhtml" class="node-content">
            <NodeReference :nodeId="id" :useName="true" />
          </div>
        </foreignObject>
      </g>
    </TransitionGroup>

    <g class="edgePath" stroke='#444' fill="none">
      <path v-for="({ v, w }) in edges"
          :key="`${v}-${w}`"
          :d="edgeD(v, w)"
          marker-end="url(#arrowhead)"
          />
    </g>
  </svg>
</template> 

<script setup lang="ts">
import { computed } from 'vue';
import { Graph } from '@dagrejs/graphlib';
import NodeReference from '@/components/NodeReference.vue';
import { useBookStore } from '@/stores/bookshelf';

const book = useBookStore().rawBook;

const props = defineProps<{
  graph: Graph; 
  bbox: { minX: number; minY: number; width: number; height: number };
  highlightIds: string[];
}>();

function edgeD(v:string, w:string) {
  const edge = props.graph.edge(v, w);
  if (!edge) return '';
  const pts = edge.points;
  return 'M' + pts.map(p => `${p.x},${p.y}`).join('L');
};

function nodeTransform(nodeId: string) {
  const n = props.graph.node(nodeId)!;
  const x = n.x - n.width / 2;
  const y = n.y - n.height / 2;
  return `translate(${x} ${y})`;
}

const nodes = computed(() => props.graph.nodes())
const edges = computed(() => props.graph.edges())
const clusters = computed(() => nodes.value.filter((n) => (props.graph.children(n).length > 0)))
const leaves = computed(() => nodes.value.filter((n) => (props.graph.children(n).length == 0)))

</script>

<style scoped>

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

.node-enter-active, .node-leave-active,
.cluster-enter-active, .cluster-leave-active {
  transition: transform 300ms ease, opacity 300ms ease;
}

.node-enter, .node-leave-to, .cluster-enter, .cluster-leave-to {
  opacity: 0;
}

.node-move, .cluster-move {
  transition: transform 500ms ease;
}

</style>
