<template>
  <router-link
    :to="{
      name: 'Node',
      params: { bookParam: book.slug || book.id, nodeParam: node.slug || node.id },
    }"
    class="reference-link"
  >
    <GlyphIcon :nodeType="node.nodetype" class="reference-glyph" />
    <span class="reference-label">{{ label }}</span>
  </router-link>
</template>

<script lang="ts">
import { useBookStore } from '../stores/bookStore.js';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import GlyphIcon from './GlyphIcon.vue';

export default {
  name: 'NodeReference',
  components: {
    GlyphIcon,
  },
  setup(props) {
    const store = useBookStore();
    const route = useRoute();
    const book_id = computed(() => route.params.bookid);
    const nodeId = computed(() => props.nodeId);
    const book = computed(() => store.rawBook);
    const node = computed(() => book.value.nodes[nodeId.value]);

    const label = computed(() => {
      const n = node.value;
      if (!n) return 'Unknown';
      if (n.name && props.useName) {
        return n.reference + ' ' + n.name;
      } else {
        return n.nodetype.secondary + ' ' + n.reference;
      }
    });

    return { book, store, node, label };
  },
  props: {
    nodeId: String,
    useName: Boolean,
  },
};
</script>

<style scoped lang="stylus">

.reference-link
  display inline-flex
  align-items baseline
  gap 0.25em
  text-decoration none

  &:hover
    text-decoration underline

.reference-glyph
  margin-right 0.1em

.reference-label
  display inline
</style>
