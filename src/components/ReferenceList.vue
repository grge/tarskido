<template>
  <ul class='reference-list'>
    <li v-for='nodeid in nodeids' :key='nodeid'>
      <NodeReference v-if="nodeid in book.nodes" :nodeId='nodeid' :useName="true" />
      <span v-if="!(nodeid in book.nodes)">[{{nodeid}}]</span>
    </li>
  </ul>
</template> 

<script lang="ts">
import NodeReference from '@/components/NodeReference.vue'
import { useBookStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';


export default {
  name: 'ReferenceList',
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    return { book, store }
  },
  props: {
    nodeids: Array,
  },
  components: {
    NodeReference,
  }
}
</script>

<style scoped lang="stylus">
.reference-list
  list-style-type none
  margin-left 2em
  padding 0

.reference-list span
  padding-right 1em
  font-style italic

.reference-list li
  display block
  opacity 60%
  padding-right 2em
  font-size 70%

</style>
