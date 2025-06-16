<template>
  <router-link :to="{name: 'Node', params: {bookParam: book.slug || book.id, nodeParam: node.slug || node.id}}" class='reference-link'>
    <span :class='"reference-subtype-" + node.nodetype.secondary'>{{label}}</span>
  </router-link>
</template>

<script lang="ts">
import { useBookStore } from '../stores/bookStore.ts';
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

    const label = computed(() => {
      const n = node.value;
      if (n.name && props.useName) {
        return n.reference + " " + n.name;
      }
      else {
        return n.nodetype.secondary + " " + n.reference;
      }
    });

    return { book, store, node, label };
  },
  props: {
      nodeId: String,
      useName: Boolean,
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
