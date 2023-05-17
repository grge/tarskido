<template>
  <div>
    <h3>Contents</h3>
    <table>
      <tr :key='node_lvl0.id' v-for="node_lvl0 in toc_data">
        <td>
          <div class='level-0'>
            <router-link
              :to="{name: 'Node', params: {bookid: book.id, nodeid: node_lvl0.id}}">
            {{node_lvl0.subtype}} {{node_lvl0.reference}}.
            </router-link>
          </div>
        </td>
        <td>
          <div class='level-0'>
            <router-link
              :to="{name: 'Node', params: {bookid: book.id, nodeid: node_lvl0.id}}"
              v-if='node_lvl0.name != ""'>
              {{node_lvl0.name}}
            </router-link>
            <router-link
              :to="{name: 'Node', params: {bookid: book.id, nodeid: node_lvl0.id}}"
              v-if='node_lvl0.name == ""'>
              Unnamed
            </router-link>
            <div class='level-1' :key='child_lvl1.id' v-for='child_lvl1 in node_lvl0.children'>
              <router-link
                :to="{name: 'Node', params: {bookid: book.id, nodeid: child_lvl1.id}}">
                {{child_lvl1.reference}}&emsp;&emsp;{{child_lvl1.name}}
              </router-link>
              <div :key='child_lvl2.id' v-for='child_lvl2 in child_lvl1.children' class='level-2'>
                <router-link
                  :to="{name: 'Node', params: {bookid: book.id, nodeid: child_lvl2.id}}">
                  {{child_lvl2.reference}}&emsp;{{child_lvl2.name}}
                </router-link>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    const graph = computed(() => store.getBookGraph(book_id))
    return { store, book, graph }

  },
  computed: {
    toc_data() {
      const book = this.book;
      function tree_nodes(tree) {
        var chapter_nodes = tree.filter((n) => { return book.nodes[n.id].nodetype.secondary == 'Chapter'})
        
        return chapter_nodes.map((n) => {
          return {
            id: n.id,
            children: tree_nodes(n.children),
            ... book.nodes[n.id]
          }
        })
      }

      var tree = this.graph.getSubgraphTree('ROOT')
      return tree_nodes(tree)
    }
  }
}
</script>

<style scoped lang="stylus">
table
 width 80%
 margin 0 auto

table a
 text-decoration none
 color black

table a:hover
 text-decoration underline

table tr td:first-child
 vertical-align top
 text-align right
 padding-right 2em
 width 15em

table td
 padding-bottom 1em

table tr td:nth-child(2)
 vertical-align top
 text-align left
 width 50em

.level-0 > a
 line-height 2em
 font-weight bold

.level-1 > a
 line-height 1.5em
 margin-top 2em

.level-2 > a
 font-style italic

.level-2 
  margin-left 1.15em

</style>
