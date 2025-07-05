<template>
  <router-link :to="linkDestination" :class="linkClass">
    <slot></slot>
  </router-link>
</template>

<script lang="ts">
import { useBookStore } from '@/stores/bookStore';
import { computed } from 'vue';

export default {
  name: 'SlugLink',
  setup(props) {
    const store = useBookStore();
    const book = computed(() => store.rawBook);

    const linkDestination = computed(() => {
      if (props.nodeId) {
        const node = book.value.nodes[props.nodeId];
        if (!node) {
          console.warn(`SlugLink: Node with ID ${props.nodeId} not found`);
          return { name: 'NotFound' };
        }
        return {
          name: props.routeName || 'Node',
          params: {
            bookParam: book.value.slug || book.value.id,
            nodeParam: node.slug || node.id
          }
        };
      } else if (props.bookId) {
        return {
          name: props.routeName || 'Book',
          params: {
            bookParam: book.value.slug || book.value.id
          }
        };
      }
      return { name: 'Home' };
    });

    return { linkDestination };
  },
  props: {
    nodeId: {
      type: String,
      default: null
    },
    bookId: {
      type: String,
      default: null
    },
    linkClass: {
      type: String,
      default: ''
    },
    routeName: {
      type: String,
      default: null
    }
  }
};
</script>