<template>
  <div class="contents">
    <h3>Table of Contents</h3>
    <ul>
      <li v-for="chap in toc" :key="chap.id" class="toc-l1-li">
        <span class="toc-l1-margin">{{ chap.ref }}</span>
        <div class="toc-l1-content">
          <router-link :to="{ name: 'Node', params: { bookid: book.id, nodeid: chap.id } }">
            <span class="toc-l1-title">{{ chap.title }}</span>
          </router-link>
          <ul>
            <li v-for="sec in chap.children" :key="sec.id" class='toc-l2-li'>
              <div class='toc-l2-line'>
                <router-link :to="{ name: 'Node', params: { bookid: book.id, nodeid: sec.id } }">
                  <span class='toc-l2-label'>{{ sec.ref }}</span>
                  <span class='toc-l2-title'>{{ sec.title }}</span>
                </router-link>
              </div>
            </li>
          </ul>
        </div>
      </li>
      <li class="toc-l1-li">
        <span class="toc-l1-margin">-</span>
        <div class="toc-l1-content">
          <span class="toc-l1-title">Orphaned Nodes</span>
          <ul>
            <li v-for="node in orphaned" :key="node.id" class='toc-l2-li'>
              <div class='toc-l2-line'>
                <router-link :to="{ name: 'Node', params: { bookid: book.id, nodeid: node.id } }">
                  <span class='toc-l2-label'>{{ node.ref }}</span>
                  <span class='toc-l2-title'>{{ node.title }}</span>
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
import { computed } from 'vue'
import { useBookStore } from '@/stores/bookshelf'

/** A generic TOC node */
interface TocEntry {
  id: string
  ref: string
  type: string
  title: string
  children: TocEntry[]
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
      return ids.filter(id => {
        const data = book.value.nodes[id];
        return (data && data.nodetype.primary == 'Group')
      }).map(id => {
        const data = book.value.nodes[id];
        return {
          id: id,
          ref: data.reference,
          type: data.nodetype.secondary,
          title: data.name || (data.nodetype.secondary + " " + data.reference),
          children: buildToc(graph.value.children(id) || [])
        }
      });
    };

    function collectOrphans() {
      const nodes = book.value.nodes;
      const ids = graph.value.nodes().filter(id => {
        if (id == rootId) return false;
        const node = nodes[id];
        return ((!node) || (((node.chapter == "") || (node.chapter == rootId)) && (node.nodetype.primary != "Group")))
      });
      return ids.map(id => {
        const data = nodes[id];
        if (!data) {
          return {
            id: id,
            ref: "Unknown",
            type: "Unknown",
            title: "Unknown Node",
            children: []
          }
        }
        return {
          id: id,
          ref: data.reference,
          type: data.nodetype.secondary,
          title: data.name || (data.nodetype.secondary + " " + data.reference),
          children: []
        }
      });
    }
        // Top‐level chapters
    const toc = computed<TocEntry[]>(() => {
      const topIds = graph.value.children(rootId) ?? []
      return buildToc(topIds)
    });

    const orphaned = computed<TocEntry[]>(() => {
      return collectOrphans()
    });

    return { book, toc, orphaned }
  }
}
</script>

<style scoped>
.contents {
  padding: 1rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.toc-l1-margin {
  margin-left: 0.5rem;
  display: inline-block;
  font-size: 1.3rem;
}

.toc-l1-content {
  display: inline; 
}

.toc-l1-title {
  font-weight: bold;
  padding-left: 2rem;
}

.toc-l1-li {
  margin: 0.5rem 0;
  list-style: none;
}

.toc-l2-li {
  margin: 0.2rem 0;
  list-style: none;
}

.toc-l2-line {
  
}

.toc-l2-label {
  font-size: 1.1rem;
  padding: 0 0.9rem 0 0.6rem;
}

</style>
