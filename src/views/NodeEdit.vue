<template>
  <div>
    <div class="book-content">
      <h2>Editing node</h2>
      <table class='edit-table'>
        <tbody>
        <tr><th>Reference</th><td><input type='text' v-model="node.reference"></td></tr>
        <tr><th>Name</th><td><input type='text' v-model="node.name"/></td></tr>

        <tr>
          <th>Type</th>
          <td>
            <select v-model='node.nodetype.primary'>
              <option :key='loop_type' :value='loop_type' v-for='loop_type in valid_types()'>{{loop_type}}</option>
            </select>
          </td>
        </tr>
        <tr>
          <th>SubType</th>
          <td>
            <select v-model='node.nodetype.secondary'>
              <option :key='loop_subtype' :value='loop_subtype' v-for='loop_subtype in valid_subtypes(node.nodetype.primary)'>{{loop_subtype}}</option>
            </select>
          </td>
        </tr>
        <tr><th>Slug</th><td><input type='text' v-model="node.slug"/></td></tr>
        <tr><th>References</th>
          <td>
            <Multiselect placeholder='Add references...' mode="tags" v-model='node.references' :options='valid_references()'> -->
            </Multiselect>
          </td>
        </tr>
        <tr><th>Parent chapter</th>
          <td>
            <select v-model='node.chapter'>
              <option value='ROOT'>None</option>
              <option :key='cnode.id' :value='cnode.id' v-for='cnode in valid_chapters()'>{{cnode.nodetype.secondary}} {{cnode.reference}}</option>
            </select>
          </td>
        </tr>
        <tr><th>Statement</th><td><textarea v-model="node.statement"></textarea></td></tr>
        <tr v-if='node.nodetype.primary == "Proposition"'>
          <th>Proof</th>
          <td>
            <a @click='createProofLine' class='editlink'>Add new line</a>
            <table class='proof-lines-table'>
              <tr :key='ix' v-for='(line, ix) in node.proof_lines'><th>Proof Line {{ix}}</th>
                <td>
                  <textarea v-model='node.proof_lines[ix].statement'></textarea>
                  <Multiselect
                    placeholder='Add references...'
                    mode="tags"
                    v-model='node.proof_lines[ix].references'
                    :options='valid_references()'>
                  </Multiselect>
                  <a @click='deleteProofLine(ix)' class='deletelink editlink'>Delete this line</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        </tbody>
      </table>
      <div class='listoflinks'>
        <router-link class='navigatelink navbacklink' :to="{name:'Node', params:{bookParam: book.slug || book.id, nodeParam: node.slug || node.id}}">Back to node view</router-link>
        <a class='editlink deletelink' @click='deleteThisNode'>Delete this node</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Multiselect from '@vueform/multiselect'
import { useBookStore, type Node, VALID_NODE_TYPE } from '@/stores/bookStore';
import { useRoute } from 'vue-router';

export default {
  name: 'NodeEdit',
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const node = book.nodes[useRoute().params.nodeId];
    return { book, node, store };
  },
  methods: {
    deleteThisNode() {
      const parent = this.node.chapter;
      this.store.deleteNode(this.node.id);
      if (parent && parent != 'ROOT') {
        const parentNode = this.book.nodes[parent];
        this.$router.push({name:'Node', params:{bookParam: this.book.slug || this.book.id, nodeParam: parentNode.slug || parentNode.id}});
      } else {
        this.$router.push({name:'Book', params:{bookParam: this.book.slug || this.book.id}});
      }
    },
    createProofLine() {
      this.node.proof_lines.push({statement: '', references: []});
    },
    deleteProofLine(ix) {
      this.node.proof_lines.splice(ix, 1);
    },
    updateProofLineStatement(ix, statement) {
    },
    updateProofLineReferences(ix, references) {
    },
    valid_types() {
      return Object.keys(VALID_NODE_TYPE);
    },
    valid_subtypes(type:string) {
      return VALID_NODE_TYPE[type]
    },
    valid_references() {
      // TODO: Remove any nodes that refer to this node (including indirectly)
      return Object.values(this.book.nodes).filter((n:Node) => (n.nodetype.primary != 'Group')).map((n:Node) => ({value: n.id, label: n.nodetype.secondary + " " + n.reference + " " + n.name}));
    },
    valid_chapters() {
      return Object.values(this.book.nodes).filter((n:Node) => (n.nodetype.primary == 'Group'));
      // var g = this.$store.getters.selectedBookGraph;

      // // get all descendent nodes of node (i.e. all nodes that are children or children of children, etc)
      // // this routine should be moved into the graphlib class
      // function getAllDescendents(nodeid) {
      //   var children = g.children(nodeid)
      //   return children.concat(...children.map(getAllDescendents))
      // }

      // var descendents = getAllDescendents(this.node.id);

      // /* Any node is a valid parent chapter for this node if it:
      //    * has type='Chapter'
      //    * is not the same node as this node
      //    * is not a descendent chapter of this node 
      // */
      // var valid_chapters = Object.values(this.book.nodes).filter((n) => {
      //   return (n.type == 'Group') && (!descendents.includes(n.id)) && (n.id != this.node.id)
      // })

      // return valid_chapters
    },
    reference_label(nodeid) {
      var n = this.book.nodes[nodeid];
      return n.nodetype.secondary + " " + n.reference + " " + n.name
    }

  },
  components: {
    Multiselect
  }
}
</script>

<style src="@vueform/multiselect/themes/default.css"></style>

<style scoped lang='stylus'>
.edit-table
 width 80%

.edit-table th
 text-align right
 vertical-align top

.edit-table td
 text-align left

.multiselect
  width 30em

.proof-lines-table textarea
  height 200px
  width 30em
  
.proof-lines-table th
  padding-top 20px
  font-weight normal 

.proof-lines-table td
  padding-top 20px
</style>
