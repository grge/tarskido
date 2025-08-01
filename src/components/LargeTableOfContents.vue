<template>
  <div class="contents">
    <h2>Table of Contents</h2>
    <ul>
      <li v-for="chap in toc" :key="chap.id" class="toc-l1-li">
        <span class="toc-l1-margin">{{ chap.ref }}</span>
        <div class="toc-l1-content">
          <router-link
            :to="{
              name: 'Node',
              params: { bookParam: book.slug || book.id, nodeParam: chap.slug || chap.id },
            }"
          >
            <span class="toc-l1-title">{{ chap.title }}</span>
          </router-link>
          <ul>
            <li v-for="sec in chap.children" :key="sec.id" class="toc-l2-li">
              <div class="toc-l2-line">
                <router-link
                  :to="{
                    name: 'Node',
                    params: { bookParam: book.slug || book.id, nodeParam: sec.slug || sec.id },
                  }"
                >
                  <span class="toc-l2-label">{{ sec.ref }}</span>
                  <span class="toc-l2-title">{{ sec.title }}</span>
                </router-link>
              </div>
            </li>
          </ul>
        </div>
      </li>
      <li class="toc-l1-li" v-if="orphaned.length > 0">
        <span class="toc-l1-margin">-</span>
        <div class="toc-l1-content">
          <span class="toc-l1-title">Orphaned Nodes</span>
          <ul>
            <li v-for="node in orphaned" :key="node.id" class="toc-l2-li">
              <div class="toc-l2-line">
                <router-link
                  :to="{
                    name: 'Node',
                    params: { bookParam: book.slug || book.id, nodeParam: node.slug || node.id },
                  }"
                >
                  <span class="toc-l2-label">{{ node.ref }}</span>
                  <span class="toc-l2-title">{{ node.title }}</span>
                </router-link>
              </div>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue';
import { useBookStore } from '@/stores/bookStore';

/** A generic TOC node */
interface TocEntry {
  id: string;
  ref: string;
  slug: string;
  type: string;
  title: string;
  children: TocEntry[];
}

export default {
  setup() {
    const store = useBookStore();

    // shorthand to the raw JSON + graphlib Graph instance
    const book = computed(() => store.rawBook);
    const graph = computed(() => store.graph);

    // if you have a known “root” container, use it; otherwise null means top-level
    const rootId = 'ROOT';

    function buildToc(ids: string[]): TocEntry[] {
      ids = ids.filter(id => {
        const data = book.value.nodes[id];
        return data && data?.nodetype.primary == 'Group';
      });

      ids = store.sortNodesByReference(ids) || [];

      return ids.map(id => {
        const data = book.value.nodes[id];
        return {
          id: id,
          ref: data.reference,
          slug: data.slug,
          type: data.nodetype.secondary,
          title: data.name || data.nodetype.secondary + ' ' + data.reference,
          children: buildToc(store.sortNodesByReference(graph.value.children(id)) || []),
        };
      });
    }

    function collectOrphans() {
      const nodes = book.value.nodes;
      const ids = graph.value.nodes().filter(id => {
        if (id == rootId) return false;
        const node = nodes[id];
        return (
          !node ||
          ((node.chapter == '' || node.chapter == rootId) && node.nodetype.primary != 'Group')
        );
      });
      return ids.map(id => {
        const data = nodes[id];
        if (!data) {
          return {
            id: id,
            ref: 'Unknown',
            slug: undefined,
            type: 'Unknown',
            title: 'Unknown Node',
            children: [],
          };
        }
        return {
          id: id,
          ref: data.reference,
          slug: data.slug,
          type: data.nodetype.secondary,
          title: data.name || data.nodetype.secondary + ' ' + data.reference,
          children: [],
        };
      });
    }
    // Top‐level chapters
    const toc = computed<TocEntry[]>(() => {
      const topIds = graph.value.children(rootId) ?? [];
      return buildToc(topIds);
    });

    const orphaned = computed<TocEntry[]>(() => {
      return collectOrphans();
    });

    return { book, toc, orphaned };
  },
};
</script>

<style scoped>
.contents {
  padding: var(--sp-4) var(--sp-8);
  max-width: 25em;
  margin: 0 auto;
  font-size: var(--fs-400);
}

h2 {
  text-align: center;
}

a {
  text-decoration: none;
  color: black;
}

a:hover {
  text-decoration: underline;
}

.toc-l1-margin {
  margin-left: 0.2rem;
  display: inline-block;
}

.toc-l1-content {
  display: inline;
}

.toc-l1-title {
  padding-left: 2rem;
}

.toc-l1-li {
  margin: 1.1rem 0;
  list-style: none;
}

.toc-l2-li {
  margin: 0.5rem 0;
  list-style: none;
}

.toc-l2-label {
  padding: 0 0.9rem 0 0.6rem;
}
</style>
