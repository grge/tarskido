<template>
  <div class='node-detail'>
      <div class='node-detail-header'>
        <component :is="'h'+ (level+1)">
          {{node.name == "" ? node.nodetype.secondary + " " + node.reference : node.name}}
        </component>
        <div class='editlinks listoflinks'>
          <NodeReference :node="node"/>
          <router-link class='editlink' :to="{ name: 'NodeEdit', params: {bookid: book.id, nodeid: node.id}}">Edit node</router-link>
          <a class='editlink' @click='store.createGroupChildNode(book.id, node.id)' v-if='level == 1 && node.nodetype.primary == "Group"'>Create child node</a>
        </div>
        <div class='navlinks listoflinks' v-if='level == 1'>
          <!-- <a class='navlink navpreviouslink'>Previous</a> -->
          <a class='navlink navpreviouslink'>Previous</a>
          <router-link :to="{ name: 'Node', params: {bookid:book.id, nodeid: node.chapter} }" class='navlink navuplink' v-if="node.chapter">Up</router-link>
          <router-link :to="{ name: 'Book', params: {bookid:book.id} }" class='navlink navuplink' v-if="! node.chapter">Up</router-link>
          <a class='navlink navnextlink'>Next</a>
          <a class='navlink navtoclink'>Show contents</a>
        </div>
      </div>

      <!-- <Dagre v-if='level==1' :graph='nodeContextGraph' /> -->

      <MdEditor v-model="node.statement" previewOnly />

      <ReferenceList v-if='node.references.length' :nodeids='node.references' />

      <NodeProof v-if='node.nodetype.primary == "Proposition"' :node='node'/>

      <!-- <MultipartNodeDetails v-if='node.subtype == "Multi-part"' :node='node'/> -->
  </div>
</template> 
<script lang="ts">
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MdEditor from 'md-editor-v3';
import NodeProof from '@/components/NodeProof.vue'
import NodeReference from '@/components/NodeReference.vue'
// import MultipartNodeDetails from '@/components/MultipartNodeDetails.vue'
import ReferenceList from '@/components/ReferenceList.vue'

export default {
  name: 'NodeDetails',
  components: {
    NodeReference,
    NodeProof,
    ReferenceList,
    // MultipartNodeDetails,
    MdEditor,
  },
  setup(props) {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    const node = computed(() => book.value.nodes[props.nodeid])

    return { book, store, node };
  },
  props: {
    nodeid: String,
    level: Number
  },
}
</script>

<style scoped lang="stylus">

.node-detail-header
  margin-top 1.15em
  margin-bottom 1em

.node-detail-header .node-name
  font-weight normal 
  margin-left 0.5em

.editlinks.navlinks
  margin-top 1.5em

.node-detail
  margin-top 1em
  margin-bottom 40px
  max-width 40em

</style>
