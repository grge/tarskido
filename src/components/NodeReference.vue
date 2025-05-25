<template>
  <router-link :to="{name: 'Node', params: {bookid: book.id, nodeid: node.id}}" class='reference-link'>
    <span :class='"reference-subtype-" + node.nodetype.secondary'>{{node.nodetype.secondary}} {{node.reference}}</span>
  </router-link>
</template>

<script lang="ts">
import { useBookStore } from '../stores/bookshelf.ts';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

export default {
  name: 'NodeReference',
  setup(props) {
    const store = useBookStore();
    const route = useRoute()
    const book_id = computed(() => route.params.bookid);
    const nodeId = computed(() => props.nodeId);
    const book = computed(() => store.rawBook);
    const node = computed(() => book.value.nodes[nodeId.value]);

    return { book, store, node };
  },
  props: {
      nodeId: String
  },
}
</script>

<style scoped lang="stylus">

.reference-subtype-Comment::before
  content "= "

.reference-subtype-Note::before
  content "= "

.reference-subtype-Chapter::before
  content "✧ "

.reference-subtype-Appendix::before
  content "✧ "

.reference-subtype-Definition::before
  content "▣ "

.reference-subtype-Axiom::before
  content "▣ "

.reference-subtype-Proposition::before
  content "⍟ "

.reference-subtype-Corollary::before
  content "⍟ "

.reference-subtype-Theorem::before
  content "⬤ "

.reference-subtype-Lemma::before
  content "◑ "
</style>
