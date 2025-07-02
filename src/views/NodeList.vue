<script lang="ts">
import CornerMenu from '@/components/CornerMenu.vue';
import { useBookStore } from '@/stores/bookStore';
import { useRouter } from 'vue-router';

export default {
  components: {
    CornerMenu,
  },
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const router = useRouter();
    console.log(book.nodes)
    return { nodes: Object.values(book.nodes) }
  },
}
</script>

<template>
  <div>
    <CornerMenu />
      <div class='book-content'>
        <el-table :data="nodes" style="width: 80%">
          <el-table-column prop="id" label="Id" />
          <el-table-column prop="nodetype.secondary" sortable label="Type" />
          <el-table-column prop="reference" sortable label="Reference" />
          <el-table-column prop="slug" sortable label="Slug" />
          <el-table-column prop="name" sortable label="Name" />
          <el-table-column label="Operations">
            <el-button>Edit</el-button>
            <el-button>Delete</el-button>
          </ el-table-column>

        </el-table>
      </div>
  </div>
</template>

<style scoped lang='stylus'>
</style>
