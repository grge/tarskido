<template>
  <div class='node-detail'>
      <div class='node-detail-header'>
        <component :is="'h'+ (level+1)">
          {{node.name == "" ? node.nodetype.secondary + " " + node.reference : node.name}}
        </component>
        <div class='editlinks listoflinks'>
          <NodeReference :nodeId="node.id"/>
          <router-link class='editlink' :to="{ name: 'NodeEdit', params: {bookid: book.id, nodeid: node.id}}">Edit node</router-link>
          <a class='editlink' @click='createChildNode()' v-if='level == 1 && node.nodetype.primary == "Group"'>Create child node</a>
        </div>
        <div class='navlinks listoflinks' v-if='level == 1'>
          <!-- <a class='navlink navpreviouslink'>Previous</a> -->
          <a class='navlink navpreviouslink'>Previous</a>
          <router-link :to="{ name: 'Node', params: {bookid:book.id, nodeid: node.chapter} }" class='navlink navuplink' v-if="node.chapter && node.chapter != 'ROOT'">Up</router-link>
          <router-link :to="{ name: 'Book', params: {bookid:book.id} }" class='navlink navuplink' v-if="! node.chapter || node.chapter == 'ROOT'">Up</router-link>
          <a class='navlink navnextlink'>Next</a>
          <a class='navlink navtoclink'>Show contents</a>
        </div>
        <ContextGraph :contextIds='[node.id]' v-if='level == 1' />
      </div>

      <div class='node-body'>
        <MdEditor v-model="node.statement" previewOnly />
      </div>

      <ReferenceList v-if='node.references.length' :nodeids='node.references' />

      <NodeProof v-if='node.nodetype.primary == "Proposition"' :node='node'/>

      <!-- <MultipartNodeDetails v-if='node.subtype == "Multi-part"' :node='node'/> -->
  </div>
</template> 
<script lang="ts">
import { useBookStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import MdEditor from 'md-editor-v3';
import NodeProof from '@/components/NodeProof.vue'
import NodeReference from '@/components/NodeReference.vue'
// import MultipartNodeDetails from '@/components/MultipartNodeDetails.vue'
import ReferenceList from '@/components/ReferenceList.vue'
import ContextGraph from '@/components/ContextGraph.vue';

export default {
  name: 'NodeDetails',
  components: {
    NodeReference,
    NodeProof,
    ReferenceList,
    // MultipartNodeDetails,
    MdEditor,
    ContextGraph
  },
  setup(props) {
    const router = useRouter();
    const store = useBookStore();
    const book = store.rawBook;

    const nodeId = props.nodeid;
    const node = book.nodes[nodeId];

    function createChildNode() {
      const childId = uuidv4();
      const child = {
        id: childId,
        reference: '',
        name: '',
        nodetype: { primary: '', secondary: '' },
        statement: '',
        references: [],
        chapter: nodeId,
        proof_lines: []
      };
      store.upsertNode(child);
      router.push({ name: 'NodeEdit', params: { bookid: store.rawBook.id, nodeid: childId }}); 
    }

    return { book, store, node, createChildNode };
  },
  props: {
    nodeid: String,
    level: Number
  },
}
</script>

<style scoped lang="stylus">

.node-body
  text-align left

.node-detail-header
  margin-top 1.15em
  margin-bottom 1em

.node-detail-header .node-name
  font-weight normal 
  margin-left 0.5em

.editlinks.navlinks
  margin-top 1.5em

.context-graph
  margin-top 1.5em

.node-detail
  margin-top 1em
  margin-bottom 40px
  max-width 40em

</style>
