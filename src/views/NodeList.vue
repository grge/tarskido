<script lang="ts">
import { useBookStore } from '@/stores/bookStore';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Node } from '@/stores/bookStore';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

export default {
  components: {
    MarkdownRenderer,
  },
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const router = useRouter();

    const searchQuery = ref('');
    const selectedType = ref('');
    const sortBy = ref('reference');

    const nodeTypes = [
      { label: 'All Types', value: '' },
      { label: 'Comment', value: 'Comment' },
      { label: 'Definition', value: 'Definition' },
      { label: 'Group', value: 'Group' },
      { label: 'Proposition', value: 'Proposition' },
    ];

    const sortOptions = [
      { label: 'Reference', value: 'reference' },
      { label: 'Name', value: 'name' },
      { label: 'Type', value: 'type' },
    ];

    const filteredAndSortedNodes = computed(() => {
      let nodes = Object.values(book.nodes) as Node[];

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        nodes = nodes.filter(
          node =>
            node.name.toLowerCase().includes(query) ||
            node.reference.toLowerCase().includes(query) ||
            node.statement.toLowerCase().includes(query) ||
            (node.slug && node.slug.toLowerCase().includes(query))
        );
      }

      // Filter by type
      if (selectedType.value) {
        nodes = nodes.filter(node => node.nodetype.primary === selectedType.value);
      }

      // Sort nodes
      nodes.sort((a, b) => {
        const cmp = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;

        switch (sortBy.value) {
          case 'reference':
            return cmp(a.reference, b.reference);
          case 'name':
            return cmp(a.name, b.name);
          case 'type':
            return cmp(a.nodetype.secondary, b.nodetype.secondary);
          default:
            return 0;
        }
      });

      return nodes;
    });

    const handleView = (node: Node) => {
      router.push(`/book/${book.slug || book.id}/${node.id}`);
    };

    const handleEdit = (node: Node) => {
      router.push(`/book/${book.slug || book.id}/${node.id}/edit`);
    };

    const handleDelete = async (node: Node) => {
      try {
        await ElMessageBox.confirm(
          `Are you sure you want to delete "${
            node.name || node.nodetype.secondary + ' ' + node.reference
          }"?`,
          'Confirm Delete',
          {
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            type: 'warning',
          }
        );

        store.deleteNode(node.id);
        ElMessage.success('Node deleted successfully');
      } catch {
        // User cancelled
      }
    };

    return {
      filteredAndSortedNodes,
      searchQuery,
      selectedType,
      sortBy,
      nodeTypes,
      sortOptions,
      handleView,
      handleEdit,
      handleDelete,
    };
  },
};
</script>

<template>
  <div>
    <div class="book-content">
      <!-- Search and Filter Controls -->
      <div class="controls">
        <el-input
          v-model="searchQuery"
          placeholder="Search nodes by name, reference, or content..."
          clearable
          style="width: 300px; margin-right: 16px"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="selectedType"
          placeholder="Filter by type"
          style="width: 150px; margin-right: 16px"
        >
          <el-option
            v-for="type in nodeTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>

        <el-select v-model="sortBy" placeholder="Sort by" style="width: 120px">
          <el-option
            v-for="option in sortOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>

      <!-- Node Table -->
      <el-table
        :data="filteredAndSortedNodes"
        style="width: 100%; margin-top: 16px"
        @row-click="handleView"
        row-style="cursor: pointer;"
      >
        <el-table-column prop="nodetype.secondary" label="Type" width="120" />
        <el-table-column prop="reference" label="Reference" width="120" sortable />
        <el-table-column label="Name" min-width="200">
          <template #default="{ row }">
            <span v-if="!row.name"> {{ row.nodetype.secondary }} {{ row.reference }} </span>
            <MarkdownRenderer v-else :markdown="row.name" :inline="true" />
          </template>
        </el-table-column>
        <el-table-column prop="slug" label="Slug" width="150" />
        <el-table-column prop="chapter" label="Chapter" width="120" />
        <el-table-column label="Operations" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="handleView(row)"> View </el-button>
            <el-button type="default" size="small" @click.stop="handleEdit(row)"> Edit </el-button>
            <el-button type="danger" size="small" @click.stop="handleDelete(row)">
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Results Count -->
      <div class="results-info">Showing {{ filteredAndSortedNodes.length }} nodes</div>
    </div>
  </div>
</template>

<style scoped lang="stylus">
.book-content
  padding: 20px
  max-width: 1200px
  margin: 0 auto

.controls
  display: flex
  align-items: center
  margin-bottom: 16px
  flex-wrap: wrap
  gap: 8px

.results-info
  margin-top: 16px
  color: #666
  font-size: 14px
  text-align: right
</style>
