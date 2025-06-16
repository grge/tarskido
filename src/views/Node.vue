<template>
  <CornerMenu />
  <div>
      <div class='book-content'>
        <NodeDetails :nodeId='node.id' :level='1' />
        <div v-if='node.nodetype.primary == "Group"' class='node-children'>
          <NodeDetails :nodeId='childId' :key='childId' v-for="childId in children" :level='2'/>
        </div>
      </div>
  </div>
</template>

<script lang="ts">
import NodeDetails from '@/components/NodeDetails.vue';
import CornerMenu from '@/components/CornerMenu.vue';
import { useBookStore } from '@/stores/bookStore';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'Node',
  props: {
    nodeId: String,
    bookId: String
  },
  setup(props) {
    const route = useRoute();
    const bookStore = useBookStore();
    const node = computed(() => bookStore.rawBook.nodes[props.nodeId]);
    const children = computed(() => bookStore.sortNodesByReference(bookStore.graph.children(node.value.id)));
    return { bookStore, node, children };
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
