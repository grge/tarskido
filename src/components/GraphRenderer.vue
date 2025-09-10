
<template>
  <svg
    :viewBox="`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`"
    :width="`${bbox.width}`"
    :height="`${bbox.height}`"
    preserveAspectRatio="xMidYMid meet"
    class="graph-svg"
    :class="{ 'no-animate': !props.animate }">

    <defs>
      <filter id="softGlow" height="300%" width="300%" x="-75%" y="-75%">
        <!-- Thicken out the original shape -->
        <feMorphology operator="dilate" radius="4" in="SourceAlpha" result="thicken" />
        <!-- Use a gaussian blur to create the soft blurriness of the glow -->
        <feGaussianBlur in="thicken" stdDeviation="10" result="blurred" />
        <!-- Change the colour -->
        <feFlood flood-color="rgb(220,220,220)" result="glowColor" />
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

    <TransitionGroup name="item" tag="g" class="items" :css="true">
      <g class="cluster"
          v-for="id in clusters"
          :key="id"
          :transform="nodeTransform(id)"
          :class="`cluster ${highlightIds.includes(id) ? 'highlight' : ''}`">
        <rect :width="`${graph.node(id).width}`"
              :height="`${graph.node(id).height}`"
              fill="#eaeaea">
        </rect>
        <foreignObject :width="`${graph.node(id).width}`" :height="`${graph.node(id).height}`">
          <div xmlns="http://www.w3.org/1999/xhtml" class="cluster-reference">
            <NodeReference :nodeId="id" :useName="true"/>
          </div>
        </foreignObject>
      </g>
      <g class="node"
          v-for="id in leaves"
          :key="id"
          :transform="nodeTransform(id)"
          :class="`item ${highlightIds.includes(id) ? 'highlight' : ''}`">
        <rect :height="`${graph.node(id).height}`"
              :width="`${graph.node(id).width}`"
              :class="`${book.nodes[id].nodetype.secondary == 'Chapter' ? 'chapter' : ''}`"
        </rect>
        <foreignObject :width="`${graph.node(id).width}`" :height="`${graph.node(id).height}`">
          <div xmlns="http://www.w3.org/1999/xhtml" class="node-content">
            <NodeReference :nodeId="id" :useName="true" />
          </div>
        </foreignObject>
      </g>
    </TransitionGroup>

    <TransitionGroup name="edge" tag="g" class="edges" :css="true">
      <path v-for="({ v, w }) in edges"
          :key="`${v}-${w}`"
          :d="edgeD(v, w)"
          class="edge"
          marker-end="url(#arrowhead)"
          />
    </TransitionGroup>
  </svg>
</template> 

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Graph } from '@dagrejs/graphlib';
import NodeReference from '@/components/NodeReference.vue';
import { useBookStore } from '@/stores/bookStore';

const book = useBookStore().rawBook;

const props = defineProps<{
  graph: Graph; 
  bbox: { minX: number; minY: number; width: number; height: number };
  highlightIds: string[];
  animate: boolean;
}>();

import { line, curveBasis } from 'd3-shape';

const pathGen = line<{ x: number; y: number }>()
  .x(d => d.x)
  .y(d => d.y)
  .curve(curveBasis)

function edgeD(v:string, w:string) {
  const e = props.graph.edge(v, w);
  if (!e) return '';
  return pathGen(e.points) || ''
};

function nodeTransform(nodeId: string) {
  const n = props.graph.node(nodeId)!;
  const x = n.x - n.width / 2;
  const y = n.y - n.height / 2;
  const t = `translate(${x} ${y})`;
  return t;
}

const nodes = computed(() => props.graph.nodes())
const edges = computed(() => props.graph.edges())

function getClusterRenderOrder(): string[] {
  // Get all cluster nodes (nodes with children)
  const clusterNodes = nodes.value.filter((n: string) => props.graph.children(n).length > 0);
  
  // Calculate depth for each cluster node
  const getDepth = (nodeId: string): number => {
    const parent = props.graph.parent(nodeId);
    return parent ? 1 + getDepth(parent) : 0;
  };
  
  // Sort clusters by depth (shallowest first) so parent clusters render behind children
  return clusterNodes
    .map(nodeId => ({ nodeId, depth: getDepth(nodeId) }))
    .sort((a, b) => a.depth - b.depth) // Sort ascending by depth
    .map(item => item.nodeId);
}

const clusters = computed(() => getClusterRenderOrder())
const leaves = computed(() => nodes.value.filter((n: string) => (props.graph.children(n).length == 0)))

</script>

<style scoped>

.graph-svg {
  height: auto;
  max-width: 90vw;
  overflow: visible;
  display: block;
  justify-content: center;
  transition: all 200ms ease;
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
    stroke: #666;
    stroke-width: 2px;
}

g.node div {
  padding: 6px;
  padding-left: 10px;
}

g.highlight rect {
  fill: #666;
  filter: url(#softGlow);
}

.highlight a {
  color: white;
}

g.cluster.highlight a {
  color: #666;
}

g.cluster rect {
    fill: white;
    stroke: #888;
    stroke-width: 2px;
}

.edges path {
    fill: none;
    stroke: #333;
    stroke-width: 1.5px;
}

.cluster-reference {
  font-size: 0.8em;
  padding: 0.4em 1em;
  color: #333;
}

/* Move existing items (200ms - 500ms) */
path.edge, g.node, g.cluster {
  transition: all 200ms 400ms ease;
}

g.cluster rect, g.node rect {
  transition: all 200ms 400ms ease;
}

g.node.item-enter-from, g.cluster.item-enter-from, path.edge.edge-enter-from,
g.node.item-leave-to, g.cluster.item-leave-to, path.edge.edge-leave-to {
  opacity: 0;
}

g.node.item-enter-active, g.cluster.item-enter-active, path.edge.edge-enter-active {
  transition: opacity 200ms 400ms ease;
}

g.node.item-leave-active, path.edge.edge-leave-active {
  transition: opacity 200ms ease;
}

/* Disable all animations when no-animate class is applied */
.no-animate path.edge, .no-animate g.node, .no-animate g.cluster {
  transition: none !important;
}

.no-animate g.cluster rect, .no-animate g.node rect {
  transition: none !important;
}

.no-animate g.node.item-enter-active, .no-animate g.cluster.item-enter-active, .no-animate path.edge.edge-enter-active,
.no-animate g.node.item-leave-active, .no-animate path.edge.edge-leave-active {
  transition: none !important;
}
</style>
