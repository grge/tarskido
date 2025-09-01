<template>
  <router-link
    :to="{
      name: 'Node',
      params: { bookParam: book.slug || book.id, nodeParam: node.slug || node.id },
    }"
    class="reference-link"
  >
    <GlyphIcon :nodeType="node.nodetype" class="reference-glyph" />
    <span class="reference-label">
      <span v-if="!node.name || !useName">
        {{ node.nodetype.secondary }} {{ node.reference }}
      </span>
      <span v-else>
        {{ node.reference }} <MarkdownRenderer :markdown="node.name" :inline="true" />
      </span>
    </span>
  </router-link>
</template>

<script lang="ts">
import { useBookStore } from '../stores/bookStore.js';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import GlyphIcon from './GlyphIcon.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';

export default {
  name: 'NodeReference',
  components: {
    GlyphIcon,
    MarkdownRenderer,
  },
  setup(props) {
    const store = useBookStore();
    const route = useRoute();
    const book_id = computed(() => route.params.bookid);
    const nodeId = computed(() => props.nodeId);
    const book = computed(() => store.rawBook);
    const node = computed(() => book.value.nodes[nodeId.value]);

    return { book, store, node };
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
