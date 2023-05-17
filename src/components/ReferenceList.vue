<template>
  <ul class='reference-list'>
    <li v-for='nodeid in nodeids' :key='nodeid'>
      <NodeReference v-if="nodeid in book.nodes" :node='book.nodes[nodeid]' />
      <span v-if="!(nodeid in book.nodes)">[{{nodeid}}]</span>
    </li>
  </ul>
</template> 

<script lang="ts">
import NodeReference from '@/components/NodeReference.vue'
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';


export default {
  name: 'ReferenceList',
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
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
  display inline
  opacity 60%
  padding-right 2em
  font-size 70%

</style>
