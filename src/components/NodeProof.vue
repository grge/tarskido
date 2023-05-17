<template>
    <h4 class='proof-heading'>Proof:</h4>
    <div class="proof-line" :key='ix' v-for='(line, ix) in node.proof_lines'> 
      <MdEditor v-model="line.statement" previewOnly />
      <ReferenceList :nodeids="line.references" v-if='line.references.length' />
    </div>
</template> 

<script lang="ts">
import ReferenceList from '@/components/ReferenceList.vue'
import MdEditor from 'md-editor-v3'
import { useBookshelfStore } from '@/stores/bookshelf';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export default {
  setup() {
    const store = useBookshelfStore();
    const book_id = useRoute().params.bookid;
    const book = computed(() => store.getBookById(book_id))
    const node = computed(() => book.value.nodes[useRoute().params.nodeid])
    return { book, store, node };
  },
  props: {
    node: Object,
  },
  components: {
    ReferenceList,
    MdEditor
  }
}
</script>

<style scoped lang="stylus">

.node-proof h4 
  font-variant small-caps
  font-weight normal
  margin-bottom 0.5em

.proof-line
  font-size 18px
  padding-left 1em
  width 45em
  border-left 10px solid #dddddd


</style>

