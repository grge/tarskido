<template>
  <div class="context-graph">
    <div class="measure-container" ref="measureRoot">
      <div v-for="id in rawSubGraph.nodes()" :key="id" :data-id="id" class="measure-node">
        <NodeReference :nodeId="id" :useName="true" />
      </div>
    </div>
    <GraphOptionsMenu :graphOptions="graphOptions" />

    <!-- Node-Level Cycle Error (serious) -->
    <div v-if="cycleInfo.hasNodeCycles" class="cycle-error">
      <div class="cycle-error-header">🚨 Direct Circular Dependencies Detected</div>
      <div class="cycle-error-body">
        <p>
          <strong>Graph may not render properly due to circular dependencies between nodes:</strong>
        </p>
        <ul>
          <li v-for="(cycle, index) in cycleInfo.nodeCycles" :key="index">
            {{ cycle.join(' ↔ ') }}
          </li>
        </ul>
        <p class="cycle-error-note">
          These circular references should be resolved in the content model.
        </p>
      </div>
    </div>

    <!-- Chapter-Level Cycle Warning (only show if no node-level cycles) -->
    <div v-if="cycleInfo.hasChapterCycles && !cycleInfo.hasNodeCycles" class="cycle-warning">
      <div class="cycle-warning-header">⚠️ Chapter Dependency Cycles Detected</div>
      <div class="cycle-warning-body">
        <p>Some chapters have circular dependencies and were left uncollapsed for clarity:</p>
        <ul>
          <li v-for="(cycle, index) in cycleInfo.chapterCycles" :key="index">
            {{ cycle.join(' → ') }}
          </li>
        </ul>
        <p class="cycle-warning-note">
          Consider restructuring chapter dependencies or content organization.
        </p>
      </div>
    </div>

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
const contextGraphResult = computed(() => {
  return buildContextGraph(fullGraph.value, props.contextIds, graphOptions.value);
});

const rawSubGraph = computed(() => {
  const result = contextGraphResult.value;
  console.log(result);
  result.graph.removeNode('ROOT');
  return result.graph;
});

const cycleInfo = computed(() => {
  const result = contextGraphResult.value;
  return {
    hasChapterCycles: result.cycles && result.cycles.length > 0,
    chapterCycles: result.cycles || [],
    hasNodeCycles: result.nodeCycles && result.nodeCycles.length > 0,
    nodeCycles: result.nodeCycles || [],
    chapterEdges: result.chapterEdges,
  };
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

.cycle-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
}

.cycle-error-header {
  font-weight: bold;
  color: #721c24;
  margin-bottom: 8px;
}

.cycle-error-body {
  color: #721c24;
}

.cycle-error-body ul {
  margin: 8px 0;
  padding-left: 20px;
}

.cycle-error-body li {
  font-family: monospace;
  margin: 4px 0;
}

.cycle-error-note {
  font-style: italic;
  margin: 8px 0 0 0;
  font-size: 12px;
}

.cycle-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
}

.cycle-warning-header {
  font-weight: bold;
  color: #856404;
  margin-bottom: 8px;
}

.cycle-warning-body {
  color: #856404;
}

.cycle-warning-body ul {
  margin: 8px 0;
  padding-left: 20px;
}

.cycle-warning-body li {
  font-family: monospace;
  margin: 4px 0;
}

.cycle-warning-note {
  font-style: italic;
  margin: 8px 0 0 0;
  font-size: 12px;
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
