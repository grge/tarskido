<template>
  <h4 class="proof-heading">Proof:</h4>
  <template v-for="(line, ix) in node.proof_lines" :key="ix">
    <div class="proof-line">
      <MarkdownRenderer :markdown="line.statement" />
    </div>
    <ReferenceList v-if="line.references.length" :nodeids="line.references" />
  </template>
</template>

<script setup lang="ts">
import ReferenceList from '@/components/ReferenceList.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

import type { Node } from '@/stores/bookStore';

defineProps<{
  node: Node;
}>();
</script>

<style scoped lang="stylus">

.node-proof h4
  font-variant small-caps
  font-weight normal
  margin-bottom 0.5em

.proof-line
  font-size 18px
  padding-left 1em
  border-left 10px solid #dddddd
</style>
