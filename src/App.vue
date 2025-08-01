<template>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css" />
  <div id="app">
    <HeaderBar />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderBar from './components/HeaderBar.vue'
import { useTheme } from './composables/useTheme'

// Initialize theme on app startup
const { initializeTheme } = useTheme()
initializeTheme()
</script>

<style lang="stylus">
@import './styles/tokens.css'
@import './styles/typography.styl'

html
  position relative
  min-height 100%

body
  height 100%
  margin 0

#app
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  width 100%

.main-content
  padding-top 60px // Account for fixed header height

h2
  margin-bottom 0.15em
  margin-top 1em
  font-size var(--fs-700)

h3
  margin-bottom 0.15em
  margin-top 1em
  font-size var(--fs-600)

textarea
  font-family var(--font-mono)
  width 40em
  height 20em

a:hover
  text-decoration underline

.editlink, .deletelink, .navlink, .reference-link
  font-family var(--font-sans)
  text-decoration none
  cursor pointer
  transition var(--transition-fast)

.editlink, .deletelink
  color var(--c-accent)

.navlink
  color var(--c-nav)

.reference-link
  color var(--c-brand)

.navpreviouslink:before
  content "◀ "

.navnextlink:before
  content "▶ "

.navuplink:before
  content "▲ "

.navtoclink:before
  content "▤ "

.navbacklink:before
  content "↩ "

.editlink:before
  content "🖉 "

.deletelink:before
  content "⨯ "

.listoflinks a
  margin-right var(--sp-8)
</style>
