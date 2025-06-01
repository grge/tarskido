<template>
  <div class="markdown-body" v-html="renderedHtml" />
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import MarkdownIt from 'markdown-it';
  import markdownItKatex from 'markdown-it-katex';

  const props = defineProps({
    markdown: {
      type: String,
      required: true,
    },
  });

  const md = new MarkdownIt({
    html: true,
    linkify: true,
  }).use(markdownItKatex, {
    macros: {
      "\\iff": "\\Longleftrightarrow",
      "\\implies": "\\Longrightarrow",
    },
  });

  const renderedHtml = computed(() => {
    return md.render(props.markdown);
  });
</script>

<style scoped lang="stylus">
.markdown-body {
  /* Optional: basic styling for rendered content */
  font-family: serif;
  line-height: 1.6;
  word-wrap: break-word;
  font-size: 16pt;
}

.katex {
  font-size: 1em;
}
</style>
