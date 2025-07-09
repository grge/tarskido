<template>
  <div>
    <div class="book-content">
      <h2>Editing node</h2>

      <el-form
        :model="node"
        :rules="formRules"
        ref="nodeForm"
        label-position="left"
        label-width="120px"
        class="edit-form"
      >
        <el-form-item label="Reference" prop="reference" required>
          <el-input v-model="node.reference" placeholder="Enter reference" />
        </el-form-item>

        <el-form-item label="Name" prop="name" required>
          <el-input v-model="node.name" placeholder="Enter name" />
        </el-form-item>

        <el-form-item label="Type" prop="nodetype.primary" required>
          <el-select v-model="node.nodetype.primary" placeholder="Select type">
            <el-option v-for="type in valid_types()" :key="type" :label="type" :value="type" />
          </el-select>
        </el-form-item>

        <el-form-item label="SubType" prop="nodetype.secondary" required>
          <el-select v-model="node.nodetype.secondary" placeholder="Select subtype">
            <el-option
              v-for="subtype in valid_subtypes(node.nodetype.primary)"
              :key="subtype"
              :label="subtype"
              :value="subtype"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Slug" prop="slug" required>
          <div class="slug-input-container">
            <div class="slug-input-row">
              <el-input
                v-model="node.slug"
                :disabled="node.autoslug"
                placeholder="Enter slug"
                :class="{ 'slug-collision': slugCollision }"
                class="slug-input"
              />
              <el-button
                @click="toggleAutoSlug"
                :type="node.autoslug ? 'primary' : 'default'"
                size="small"
                class="autoslug-toggle"
              >
                {{ node.autoslug ? 'Auto' : 'Manual' }}
              </el-button>
            </div>
            <div class="slug-status">
              <span v-if="slugCollision" class="slug-error">⚠️ Slug already exists</span>
              <span v-if="node.autoslug" class="slug-auto"
                >🔄 Auto-generated from type and reference</span
              >
              <span v-else class="slug-manual">✏️ Manually editable</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="References">
          <div class="references-container">
            <el-select
              v-model="node.references"
              multiple
              filterable
              remote
              placeholder="Search and add references..."
              :remote-method="filterReferences"
              :loading="referencesLoading"
              class="references-select"
            >
              <el-option
                v-for="ref in filteredReferences"
                :key="ref.value"
                :label="ref.label"
                :value="ref.value"
              />
            </el-select>
            <div v-if="excludedNodesCount > 0" class="circular-dependency-info">
              <el-icon class="info-icon"><InfoFilled /></el-icon>
              <span class="info-text">
                {{ excludedNodesCount }} node{{ excludedNodesCount === 1 ? '' : 's' }} excluded to
                prevent circular dependencies
              </span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="Parent chapter">
          <el-select v-model="node.chapter" placeholder="Select parent chapter">
            <el-option label="None" value="ROOT" />
            <el-option
              v-for="chapter in valid_chapters()"
              :key="chapter.id"
              :label="`${chapter.nodetype.secondary} ${chapter.reference}`"
              :value="chapter.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Statement">
          <el-input
            v-model="node.statement"
            type="textarea"
            :rows="6"
            placeholder="Enter statement (supports markdown and LaTeX)"
          />
        </el-form-item>

        <el-form-item v-if="node.nodetype.primary == 'Proposition'" label="Proof">
          <div class="proof-section">
            <div class="proof-header">
              <el-button @click="createProofLine" type="primary" size="small">
                Add new line
              </el-button>
            </div>

            <div class="proof-lines">
              <el-card
                v-for="(line, ix) in node.proof_lines"
                :key="ix"
                class="proof-line-card"
                shadow="hover"
              >
                <template #header>
                  <div class="proof-line-header">
                    <span>Proof Line {{ ix + 1 }}</span>
                    <el-button
                      @click="deleteProofLine(ix)"
                      type="danger"
                      size="small"
                      :icon="Delete"
                    >
                      Delete
                    </el-button>
                  </div>
                </template>

                <el-input
                  v-model="node.proof_lines[ix].statement"
                  type="textarea"
                  :rows="4"
                  placeholder="Enter proof line statement"
                  class="proof-statement"
                />

                <div class="proof-references-container">
                  <el-select
                    v-model="node.proof_lines[ix].references"
                    multiple
                    filterable
                    remote
                    placeholder="Search and add references..."
                    :remote-method="filterReferences"
                    :loading="referencesLoading"
                    class="proof-references"
                  >
                    <el-option
                      v-for="ref in filteredReferences"
                      :key="ref.value"
                      :label="ref.label"
                      :value="ref.value"
                    />
                  </el-select>
                  <div v-if="excludedNodesCount > 0" class="circular-dependency-info proof-info">
                    <el-icon class="info-icon"><InfoFilled /></el-icon>
                    <span class="info-text">
                      {{ excludedNodesCount }} node{{ excludedNodesCount === 1 ? '' : 's' }}
                      excluded to prevent circular dependencies
                    </span>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div class="action-buttons">
        <el-button @click="goBack">Back to node view</el-button>
        <el-button type="danger" @click="deleteThisNode">Delete this node</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useBookStore, type Node, VALID_NODE_TYPE } from '@/stores/bookStore';
import { useRoute, useRouter } from 'vue-router';
import { watch, ref, computed } from 'vue';
import { Delete, InfoFilled } from '@element-plus/icons-vue';

export default {
  name: 'NodeEdit',
  setup() {
    const store = useBookStore();
    const book = store.rawBook;
    const node = book.nodes[useRoute().params.nodeId];
    const router = useRouter();

    // References search functionality
    const referencesLoading = ref(false);
    const filteredReferences = ref([]);

    // Function to check if adding a reference would create a circular dependency
    const wouldCreateCycle = (targetNodeId: string, sourceNodeId: string): boolean => {
      // If we're trying to reference ourselves, that's a cycle
      if (targetNodeId === sourceNodeId) return true;

      // Get all nodes that the target node depends on (directly and indirectly)
      const visited = new Set<string>();
      const checkDependencies = (nodeId: string): boolean => {
        if (visited.has(nodeId)) return false;
        visited.add(nodeId);

        const nodeRefs = book.nodes[nodeId]?.references || [];
        for (const refId of nodeRefs) {
          if (refId === sourceNodeId) return true; // Found a path back to source
          if (checkDependencies(refId)) return true; // Recursive check
        }
        return false;
      };

      return checkDependencies(targetNodeId);
    };

    const allReferences = computed(() => {
      return Object.values(book.nodes)
        .filter((n: Node) => {
          // Exclude Group nodes
          if (n.nodetype.primary === 'Group') return false;

          // Exclude self-reference
          if (n.id === node.id) return false;

          // Exclude nodes that would create circular dependencies
          if (wouldCreateCycle(n.id, node.id)) return false;

          return true;
        })
        .map((n: Node) => ({
          value: n.id,
          label: `${n.nodetype.secondary} ${n.reference} ${n.name}`,
        }));
    });

    // Get count of excluded nodes for user feedback
    const excludedNodesCount = computed(() => {
      const totalNonGroupNodes = Object.values(book.nodes).filter(
        (n: Node) => n.nodetype.primary !== 'Group'
      ).length;
      const availableNodes = allReferences.value.length;
      return totalNonGroupNodes - availableNodes - 1; // -1 for self-reference
    });

    // Initialize with all references
    filteredReferences.value = allReferences.value;

    const filterReferences = (query: string) => {
      if (!query) {
        filteredReferences.value = allReferences.value;
        return;
      }

      referencesLoading.value = true;

      // Filter references based on search query
      setTimeout(() => {
        filteredReferences.value = allReferences.value.filter(ref =>
          ref.label.toLowerCase().includes(query.toLowerCase())
        );
        referencesLoading.value = false;
      }, 200);
    };

    // Form validation rules
    const formRules = {
      reference: [
        { required: true, message: 'Reference is required', trigger: 'blur' },
        {
          min: 1,
          max: 50,
          message: 'Reference must be between 1 and 50 characters',
          trigger: 'blur',
        },
      ],
      name: [
        { required: true, message: 'Name is required', trigger: 'blur' },
        { min: 1, max: 200, message: 'Name must be between 1 and 200 characters', trigger: 'blur' },
      ],
      'nodetype.primary': [{ required: true, message: 'Type is required', trigger: 'change' }],
      'nodetype.secondary': [{ required: true, message: 'SubType is required', trigger: 'change' }],
      slug: [
        { required: true, message: 'Slug is required', trigger: 'blur' },
        {
          pattern: /^[a-z0-9-]+$/,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens',
          trigger: 'blur',
        },
      ],
    };

    const slugCollision = computed(() => {
      return node.slug && book.slugMap[node.slug] && book.slugMap[node.slug] !== node.id;
    });

    // Auto-generate slug when node type or reference changes
    watch([() => node.nodetype.secondary, () => node.reference], () => {
      if (node.autoslug && node.nodetype.secondary && node.reference) {
        const oldSlug = node.slug;
        const newSlug = store.generateSlug(node);
        if (newSlug !== node.slug) {
          node.slug = newSlug;
          store.updateSlugMap(node.id, newSlug, oldSlug);
        }
      }
    });

    // Handle manual slug changes
    watch(
      () => node.slug,
      (newSlug, oldSlug) => {
        if (newSlug !== oldSlug) {
          // If user manually changes slug, disable autoslug
          if (newSlug !== store.generateSlug(node)) {
            node.autoslug = false;
          }

          // Update slug map if no collision
          if (!slugCollision.value) {
            store.updateSlugMap(node.id, newSlug, oldSlug);
          }
        }
      }
    );

    const goBack = () => {
      router.push({
        name: 'Node',
        params: { bookParam: book.slug || book.id, nodeParam: node.slug || node.id },
      });
    };

    const toggleAutoSlug = () => {
      node.autoslug = !node.autoslug;
      if (node.autoslug && node.nodetype.secondary && node.reference) {
        // Generate new slug when enabling auto mode
        const oldSlug = node.slug;
        const newSlug = store.generateSlug(node);
        if (newSlug !== node.slug) {
          node.slug = newSlug;
          store.updateSlugMap(node.id, newSlug, oldSlug);
        }
      }
    };

    return {
      book,
      node,
      store,
      slugCollision,
      referencesLoading,
      filteredReferences,
      filterReferences,
      goBack,
      Delete,
      InfoFilled,
      formRules,
      toggleAutoSlug,
      excludedNodesCount,
    };
  },
  methods: {
    deleteThisNode() {
      const parent = this.node.chapter;
      this.store.deleteNode(this.node.id);
      if (parent && parent != 'ROOT') {
        const parentNode = this.book.nodes[parent];
        this.$router.push({
          name: 'Node',
          params: {
            bookParam: this.book.slug || this.book.id,
            nodeParam: parentNode.slug || parentNode.id,
          },
        });
      } else {
        this.$router.push({ name: 'Book', params: { bookParam: this.book.slug || this.book.id } });
      }
    },
    createProofLine() {
      this.node.proof_lines.push({ statement: '', references: [] });
    },
    deleteProofLine(ix) {
      this.node.proof_lines.splice(ix, 1);
    },
    valid_types() {
      return Object.keys(VALID_NODE_TYPE);
    },
    valid_subtypes(type: string) {
      return VALID_NODE_TYPE[type];
    },
    valid_chapters() {
      return Object.values(this.book.nodes).filter((n: Node) => n.nodetype.primary == 'Group');
    },
    reference_label(nodeid) {
      var n = this.book.nodes[nodeid];
      return n.nodetype.secondary + ' ' + n.reference + ' ' + n.name;
    },
  },
};
</script>

<style scoped lang="stylus">
.book-content
  padding: 20px
  max-width: 900px
  margin: 0 auto

.edit-form
  margin-bottom: 24px

.slug-input-container
  display: flex
  flex-direction: column
  gap: 8px

.slug-input-row
  display: flex
  gap: 8px
  align-items: center

.slug-input
  flex: 1

.autoslug-toggle
  min-width: 70px

.slug-status
  display: flex
  gap: 16px

.slug-error
  color: #f56c6c
  font-size: 12px

.slug-auto
  color: #67c23a
  font-size: 12px

.slug-manual
  color: #909399
  font-size: 12px

.slug-collision
  :deep(.el-input__inner)
    border-color: #f56c6c !important
    background-color: #fef0f0

.references-container
  width: 100%

.references-select
  width: 100%

.circular-dependency-info
  display: flex
  align-items: center
  gap: 6px
  margin-top: 8px
  padding: 8px
  background-color: #f0f9ff
  border: 1px solid #e1f5fe
  border-radius: 4px
  font-size: 12px
  color: #0277bd

.info-icon
  color: #0277bd
  font-size: 14px

.info-text
  color: #0277bd

.proof-info
  margin-top: 6px
  font-size: 11px

.proof-references-container
  width: 100%

.proof-section
  width: 100%

.proof-header
  margin-bottom: 16px

.proof-lines
  display: flex
  flex-direction: column
  gap: 16px

.proof-line-card
  width: 100%

.proof-line-header
  display: flex
  justify-content: space-between
  align-items: center

.proof-statement
  margin-bottom: 12px

.proof-references
  width: 100%

.action-buttons
  display: flex
  gap: 12px
  justify-content: flex-start
  margin-top: 24px

:deep(.el-form-item__label)
  font-weight: 500

:deep(.el-select)
  width: 100%
</style>
