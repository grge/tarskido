<template>
  <div class='context-graph'>
      <div class="measure-container" ref="measureRoot">
        <div v-for="id in rawSubGraph.nodes()" :key="id" :data-id="id" class="measure-node">
          <NodeReference :nodeId="id" :useName="true" />
        </div>
      </div>
      <GraphRenderer
        :graph="graph"
        :bbox="bbox"
        :highlightIds="contextIds" />
  </div>
</template> 

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useBookStore } from '@/stores/bookshelf';
import { buildContextGraph } from '@/utils/contextGraph.ts';
import { useGraphLayout } from '@/composables/useGraphLayout';
import GraphRenderer from '@/components/GraphRenderer.vue';
import NodeReference from '@/components/NodeReference.vue'

const props = defineProps<{ contextIds: string[] }>();
const store = useBookStore();

const fullGraph = computed(() => store.graph);
const rawSubGraph = computed(() => {
  const g = buildContextGraph(fullGraph.value, props.contextIds);
  g.removeNode("ROOT")
  return g;
});

const measureRoot = ref<HTMLElement | null>(null);
const { graph, bbox } = useGraphLayout(rawSubGraph, measureRoot, { padding: 20, nodeMargin: 20})

const readyForLayout = ref(false);
const nodeSizes = ref<{ [key: string]: { width: number, height: number } }>({});

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

</style>
