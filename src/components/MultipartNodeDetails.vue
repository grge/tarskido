<template>
    <div v-if='node.subtype == "Multi-part"'>
      <ul>
        <li :key='childid' v-for='childid in graph.children(node.id)'>
          <NodeReference :node='book.nodes[childid]' />
          <span class='node-name'>{{book.nodes[childid].name}}</span>
          <MarkdownItVue class='md-body' :content="book.nodes[childid].statement" />
          <ReferenceList :nodeids='book.nodes[childid].references' />
          <NodeProof :node='book.nodes[childid]' v-if='book.nodes[childid].type == "Proposition"'/>
        </li>
      </ul>
    </div>
</template> 
<script>
import NodeReference from '@/components/NodeReference.vue'
import ReferenceList from '@/components/ReferenceList.vue'
import NodeProof from '@/components/NodeProof.vue'
import MarkdownItVue from 'markdown-it-vue'


export default {
  name: 'MultipartNodeDetails',
  computed: {
    book() {
      return this.$store.state.books[this.$route.params.bookid];
    },
    selected_node() {
      return this.book.nodes[this.nodeid]
    },
    graph() {
      return this.$store.getters.selectedBookGraph
    },
  },
  props: {
    node: Object,
  },
  components: {
    ReferenceList,
    NodeReference,
    NodeProof,
    MarkdownItVue
  }
}
</script>

<style scoped lang="stylus">
ul
  list-style-type none

li
  line-height 1.5em
  margin-bottom 1em

.node-name
  margin-left 1em
  font-style italic


</style>
