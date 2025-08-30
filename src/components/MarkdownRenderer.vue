<template>
  <div class="markdown-body" v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import markdownItKatex from '@vscode/markdown-it-katex';

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
    '\\iff': '\\Longleftrightarrow',
    '\\implies': '\\Longrightarrow',
  },
});

const renderedHtml = computed(() => {
  return md.render(props.markdown);
});
</script>

<style lang="stylus">

.markdown-body
  font-family: var(--font-serif)
  line-height: var(--lh-loose)
  word-wrap: break-word
  font-size: var(--fs-400)
  color: var(--c-ink)

/* 
 * KaTeX font compatibility with STIX Two Text
 * 
 * Current approach: Optical sizing adjustments to match STIX Two Text
 * Future improvement: Custom KaTeX font implementation using STIX Two Math
 * 
 * Note: KaTeX doesn't natively support STIX fonts, but future implementation
 * could use __defineSymbol and __setFontMetrics for full STIX Two Math support
 */
.katex
  font-size: 1.2em // Reset to match the now-larger body text
  vertical-align: baseline
  
.katex-display
  margin: var(--sp-4) 0
  text-align: center
  
</style>
