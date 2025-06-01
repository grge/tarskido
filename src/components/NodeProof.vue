<template>
    <h4 class='proof-heading'>Proof:</h4>
    <template key='ix' v-for='(line, ix) in node.proof_lines'> 
      <div class='proof-line'>
        <MarkdownRenderer :markdown="line.statement" />
      </div>
      <ReferenceList :nodeids="line.references" v-if='line.references.length' />
    </template>
</template> 

<script lang="ts">
import ReferenceList from '@/components/ReferenceList.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { useBookStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const node = book.nodes[useRoute().params.nodeid]
    return { book, store, node };
  },
  props: {
    node: Object,
  },
  components: {
    ReferenceList,
    MarkdownRenderer,
  }
}
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

