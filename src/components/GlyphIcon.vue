<template>
  <svg
    class="glyph-icon"
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Foundational atoms (circles) -->
    <g v-if="nodeType.primary === 'Definition'">
      <!-- Definition: circle + dot -->
      <circle v-if="nodeType.secondary === 'Definition'" cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1"/>
      <circle v-if="nodeType.secondary === 'Definition'" cx="8" cy="8" r="2" fill="currentColor"/>
      
      <!-- Axiom: circle + star -->
      <template v-else-if="nodeType.secondary === 'Axiom'">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1"/>
        <path d="M8 3 L9.5 6.5 L13 6.5 L10.25 8.75 L11.5 12.5 L8 10 L4.5 12.5 L5.75 8.75 L3 6.5 L6.5 6.5 Z" fill="currentColor"/>
      </template>
      
      <!-- Hypothesis: circle + triangle -->
      <template v-else-if="nodeType.secondary === 'Hypothesis'">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1"/>
        <path d="M8 4 L11 11 L5 11 Z" fill="currentColor"/>
      </template>
    </g>

    <!-- Propositions (squares) -->
    <g v-else-if="nodeType.primary === 'Proposition'">
      <!-- Theorem: filled square -->
      <rect v-if="nodeType.secondary === 'Theorem'" x="1" y="1" width="14" height="14" fill="currentColor"/>
      
      <!-- Proposition: half-filled square -->
      <template v-else-if="nodeType.secondary === 'Proposition'">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1"/>
        <rect x="1" y="1" width="7" height="14" fill="currentColor"/>
      </template>
      
      <!-- Corollary: square + plus -->
      <template v-else-if="nodeType.secondary === 'Corollary'">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1"/>
        <path d="M8 4 L8 12 M4 8 L12 8" stroke="currentColor" stroke-width="1.5"/>
      </template>
      
      <!-- Lemma: square + dot -->
      <template v-else-if="nodeType.secondary === 'Lemma'">
        <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1"/>
        <circle cx="8" cy="8" r="2" fill="currentColor"/>
      </template>
    </g>

    <!-- Book Structure (stripes) -->
    <g v-else-if="nodeType.primary === 'Group'">
      <!-- Chapter: double stripe -->
      <g v-if="nodeType.secondary === 'Chapter'">
        <rect x="2" y="5" width="12" height="2" fill="currentColor"/>
        <rect x="2" y="9" width="12" height="2" fill="currentColor"/>
      </g>
      
      <!-- Section: single stripe -->
      <rect v-else-if="nodeType.secondary === 'Section'" x="2" y="7" width="12" height="2" fill="currentColor"/>
      
      <!-- Subsection: single thin stripe -->
      <rect v-else-if="nodeType.secondary === 'Subsection'" x="2" y="7.5" width="12" height="1" fill="currentColor"/>
      
      <!-- MultiPart: triple stripe -->
      <g v-else-if="nodeType.secondary === 'MultiPart'">
        <rect x="2" y="4" width="12" height="1.5" fill="currentColor"/>
        <rect x="2" y="7.25" width="12" height="1.5" fill="currentColor"/>
        <rect x="2" y="10.5" width="12" height="1.5" fill="currentColor"/>
      </g>
      
      <!-- Appendix: double stripe + accent -->
      <g v-else-if="nodeType.secondary === 'Appendix'">
        <rect x="2" y="5" width="12" height="2" fill="currentColor"/>
        <rect x="2" y="9" width="12" height="2" fill="currentColor"/>
        <circle cx="13" cy="3" r="1.5" fill="currentColor"/>
      </g>
    </g>

    <!-- Supplementary (stars/dots) -->
    <g v-else-if="nodeType.primary === 'Comment'">
      <!-- Example: filled star -->
      <path v-if="nodeType.secondary === 'Example'" d="M8 1 L10 6 L15 6 L11.5 9.5 L13 15 L8 12 L3 15 L4.5 9.5 L1 6 L6 6 Z" fill="currentColor"/>
      
      <!-- Note: empty star -->
      <path v-else-if="nodeType.secondary === 'Note'" d="M8 1 L10 6 L15 6 L11.5 9.5 L13 15 L8 12 L3 15 L4.5 9.5 L1 6 L6 6 Z" fill="none" stroke="currentColor" stroke-width="1"/>
      
      <!-- Comment: 5-dot pattern (star vertices) -->
      <g v-else-if="nodeType.secondary === 'Comment'">
        <circle cx="8" cy="1" r="1" fill="currentColor"/>
        <circle cx="15" cy="6" r="1" fill="currentColor"/>
        <circle cx="13" cy="15" r="1" fill="currentColor"/>
        <circle cx="3" cy="15" r="1" fill="currentColor"/>
        <circle cx="1" cy="6" r="1" fill="currentColor"/>
      </g>
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';

type NodeType =
  | { primary: 'Comment'; secondary: 'Comment' | 'Note' | 'Example' }
  | { primary: 'Definition'; secondary: 'Definition' | 'Axiom' | 'Hypothesis' }
  | { primary: 'Group'; secondary: 'Chapter' | 'Section' | 'Subsection' | 'MultiPart' | 'Appendix' }
  | { primary: 'Proposition'; secondary: 'Proposition' | 'Lemma' | 'Theorem' | 'Corollary' };

export default defineComponent({
  name: 'GlyphIcon',
  props: {
    nodeType: {
      type: Object as PropType<NodeType>,
      required: true,
    },
  },
});
</script>

<style scoped lang="stylus">
.glyph-icon
  display inline-block
  vertical-align baseline
  line-height 1
  flex-shrink 0
</style>