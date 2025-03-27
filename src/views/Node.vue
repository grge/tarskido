<template>
  <div>
      <TopBar />
      <div class='book-content'>
        <NodeDetails :nodeid='node.id' :level='1' />
        <ContextGraph :nodeid='node.id' />
        <div v-if='node.nodetype.secondary == "Chapter"'>
          <NodeDetails :nodeid='childnode.id' :key='childnode.id' v-for="childnode in children" :level='2'/>
        </div>
      </div>
  </div>
</template>

<script lang="ts">
import TopBar from '@/components/TopBar.vue';
import NodeDetails from '@/components/NodeDetails.vue';
import ContextGraph from '@/components/ContextGraph.vue';
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'Node',
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    const node = computed(() => book.value.nodes[useRoute().params.nodeid])
    const children = computed(
      () => Object.values(book.value.nodes).filter(
        (n) => n.chapter == useRoute().params.nodeid
      )
    )
    return { book, store, node, children };
  },
  components: {
    TopBar,
    NodeDetails,
    ContextGraph
  },
}
</script>

<style scoped lang='stylus'>
</style>
