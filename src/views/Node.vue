<template>
  <CornerMenu />
  <div>
      <div class='book-content'>
        <NodeDetails :nodeid='node.id' :level='1' />
        <div v-if='node.nodetype.secondary == "Chapter"'>
          <NodeDetails :nodeid='childId' :key='childId' v-for="childId in children" :level='2'/>
        </div>
      </div>
  </div>
</template>

<script lang="ts">
import NodeDetails from '@/components/NodeDetails.vue';
import CornerMenu from '@/components/CornerMenu.vue';
import { useBookStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'Node',
  setup() {
    const route = useRoute();
    const store = useBookStore();
    const book = computed(() => store.rawBook);
    const node = computed(() => book.value.nodes[route.params.nodeid]);
    const children = computed(() => store.sortNodesByReference(store.graph.children(node.value.id)));
    return { book, store, node, children };
  },
  components: {
    NodeDetails,
    CornerMenu,
  },
}
</script>

<style scoped lang='stylus'>
.book-content
  container-type: inline-size
  container-name: book-content
</style>
