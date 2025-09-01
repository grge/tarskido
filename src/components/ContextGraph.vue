<template>
  <div class="context-graph">
    <div class="measure-container" ref="measureRoot">
      <div v-for="id in rawSubGraph.nodes()" :key="id" :data-id="id" class="measure-node">
        <NodeReference :nodeId="id" :useName="true" />
      </div>
    </div>
    <GraphOptionsMenu :graphOptions="graphOptions" />
    <GraphRenderer
      :graph="graph"
      :bbox="bbox"
      :highlightIds="contextIds"
      :animate="graphOptions.animate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBookStore } from '@/stores/bookStore';
import { buildContextGraph } from '@/utils/contextGraph.js';
import { useGraphLayout } from '@/composables/useGraphLayout';
import GraphOptionsMenu from '@/components/GraphOptionsMenu.vue';
import GraphRenderer from '@/components/GraphRenderer.vue';
import NodeReference from '@/components/NodeReference.vue';

const props = defineProps<{ contextIds: string[] }>();
const store = useBookStore();

const graphOptions = ref({
  reduceEdges: true,
  animate: true,
  contextCollapseLevel: 1,
  outsideCollapseLevel: 0,
  predecessorRadius: 1,
  successorRadius: 1,
  includeParents: true,
  pruneSingleChildParents: true,
});

const fullGraph = computed(() => store.graph);
const rawSubGraph = computed(() => {
  const g = buildContextGraph(fullGraph.value, props.contextIds, graphOptions.value);
  console.log(g);
  g.removeNode('ROOT');
  return g;
});

const measureRoot = ref<HTMLElement | null>(null);
const { graph, bbox } = useGraphLayout(rawSubGraph, measureRoot, { padding: 20, nodeMargin: 20 });
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
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  overflow-y: visible;
  margin: 0 0;
  padding: 1em 0;
  border-top: 2px solid transparent;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(
      to right,
      transparent 10%,
      #888888 30%,
      #888888 70%,
      transparent 90%
    )
    1 / /* slice */ 1px 0 / /* widths: top/bottom 2px, left/right 0 */ 0 0;

  /* Textured background for tactile feel */
  background: var(--c-surface);
  background-image: linear-gradient(45deg, transparent 25%, rgba(0, 0, 0, 0.02) 25%),
    linear-gradient(-45deg, transparent 25%, rgba(0, 0, 0, 0.02) 25%);
  background-size: 8px 8px;
}
</style>
