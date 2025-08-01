<template>
  <div>
    <div class="book-content">
      <h2>Editing book</h2>

      <el-form
        :model="book"
        :rules="formRules"
        ref="bookForm"
        label-position="left"
        label-width="100px"
        class="edit-form"
      >
        <el-form-item label="Title" prop="title" required>
          <el-input v-model="book.title" placeholder="Enter book title" />
        </el-form-item>

        <el-form-item label="Slug" prop="slug" required>
          <el-input v-model="book.slug" placeholder="Enter book slug" />
        </el-form-item>

        <el-form-item label="Author" prop="author">
          <el-input v-model="book.author" placeholder="Enter author name" />
        </el-form-item>

        <el-form-item label="Preface">
          <div class="preface-editor">
            <div class="editor-controls">
              <el-button-group>
                <el-button :type="showPreview ? 'default' : 'primary'" @click="showPreview = false">
                  Edit
                </el-button>
                <el-button :type="showPreview ? 'primary' : 'default'" @click="showPreview = true">
                  Preview
                </el-button>
              </el-button-group>
            </div>

            <div v-if="!showPreview" class="editor-container">
              <el-input
                v-model="book.preface"
                type="textarea"
                :rows="15"
                placeholder="Enter preface content (supports markdown and LaTeX)"
                class="preface-textarea"
              />
            </div>

            <div v-else class="preview-container">
              <MarkdownRenderer :markdown="book.preface || 'No preface content'" />
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div class="action-buttons">
        <el-button @click="goBack">Back to book view</el-button>
        <el-button type="danger" @click="deleteThisBook">Delete this book</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useBookStore } from '@/stores/bookStore';
import { useRoute, useRouter } from 'vue-router';
import { useBookShelfStore } from '@/stores/bookShelfStore';
import { watch, ref } from 'vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

export default {
  setup() {
    const shelf = useBookShelfStore();
    const book = useBookStore().rawBook;
    const router = useRouter();
    const showPreview = ref(false);

    // Form validation rules
    const formRules = {
      title: [
        { required: true, message: 'Title is required', trigger: 'blur' },
        {
          min: 1,
          max: 200,
          message: 'Title must be between 1 and 200 characters',
          trigger: 'blur',
        },
      ],
      slug: [
        { required: true, message: 'Slug is required', trigger: 'blur' },
        {
          pattern: /^[a-z0-9-]+$/,
          message: 'Slug can only contain lowercase letters, numbers, and hyphens',
          trigger: 'blur',
        },
      ],
    };

    // watch (and debounce) the slug so that we can update the global slugMap
    watch(
      () => book.slug,
      (newSlug, oldSlug) => {
        if (newSlug) {
          shelf.slugMap[oldSlug] = undefined;
          shelf.slugMap[newSlug] = book.id;
        }
      },
      { immediate: true }
    );

    const goBack = () => {
      router.push({ name: 'Book', params: { bookParam: book.slug || book.id } });
    };

    const deleteThisBook = () => {
      shelf.deleteLocalBook(book.id);
      router.push({ name: 'Home' });
    };

    return {
      book,
      showPreview,
      goBack,
      formRules,
      deleteThisBook,
    };
  },
  methods: {},
  components: {
    MarkdownRenderer,
  },
};
</script>

<style scoped lang="stylus">
.book-content
  padding: 20px
  max-width: 800px
  margin: 0 auto

.edit-form
  margin-bottom: var(--sp-6)

.preface-editor
  width: 100%

.editor-controls
  margin-bottom: var(--sp-3)

.editor-container, .preview-container
  border: 1px solid var(--c-border)
  border-radius: var(--radius-sm)
  min-height: 400px

.editor-container
  padding: 0

.preview-container
  padding: var(--sp-4)
  background-color: #fafafa

.preface-textarea
  border: none
  .el-textarea__inner
    border: none
    border-radius: 0
    box-shadow: none
    resize: vertical

.action-buttons
  display: flex
  gap: var(--sp-3)
  justify-content: flex-start
  margin-top: var(--sp-6)
</style>
