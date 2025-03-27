<template>
  <div class='context-graph'>
      <svg><g/></svg>
  </div>
</template> 

<script lang="ts">
import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MdEditor from 'md-editor-v3';
import NodeProof from '@/components/NodeProof.vue'
import NodeReference from '@/components/NodeReference.vue'
// import MultipartNodeDetails from '@/components/MultipartNodeDetails.vue'
import ReferenceList from '@/components/ReferenceList.vue'

export default {
  name: 'ContextGraph',
  components: {},
  setup(props) {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))

    var g = store.getBookGraph(book_id);

    onMounted(() => {
      var inner = d3.select(".context-graph svg g");
      var render = new dagreD3.render();
      render(inner, g)
      // make the container large enough
      var svg = d3.select(".context-graph svg");
      var bbox = svg.node().getBBox();
      svg.attr("width", bbox.width);
      svg.attr("height", bbox.height);
    })

    return { book, store };
  },
  props: {
    nodeid: String,
    level: Number
  },
}
</script>

<style>
g.node rect {
    rx: 5px;
    ry: 5px;
    fill: #fff;
    stroke: #888;
    stroke-width:1.5px;
}

g.cluster rect {
    fill: #f8f8f8;
    stroke: #808080;
    stroke-width: 1.5px;
}

.edgePath {
    stroke: #333;
    stroke-width: 1.5px;
}
</style>
