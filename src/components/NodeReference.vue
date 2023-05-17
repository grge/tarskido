<template>
  <router-link :to="{name: 'Node', params: {bookid: book.id, nodeid: node.id}}" class='reference-link'>
    <span :class='"reference-subtype-" + node.nodetype.secondary'>{{node.nodetype.secondary}} {{node.reference}}</span>
  </router-link>
</template>

<script lang="ts">
import { useBookshelfStore } from '../stores/bookshelf.ts';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

export default {
  name: 'NodeReference',
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    const node = computed(() => book.value.nodes[useRoute().params.nodeid])
    return { book, store, node };
  },
  props: {
      node: Object
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
