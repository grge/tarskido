<template>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css">
  <div id="app">
    <div>
      <router-view :key="$route.fullPath" />
    </div>
  </div>
</template>

<style lang="stylus">
edit-link-color = #cc2200
nav-link-color = #6aa84f
ref-link-color = #0b5394
title-blue = #024064
background-color = #ff00fa

html
  position relative
  min-height 100%

body
  height 100%
  margin 0

#app
  font-family "Cambria", georgia, serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  width 100%

h2
  margin-bottom 0.15em
  margin-top 1em
  font-size 40px

h3
  margin-bottom 0.15em
  margin-top 1em
  font-size 26px

textarea 
  font-family fixed
  width 40em
  height 20em

a:hover
  text-decoration underline

.editlink, .deletelink, .navlink, .reference-link
  font-family sans-serif
  text-decoration none
  cursor pointer

.editlink, deletelink
  color edit-link-color

.navlink
  color nav-link-color

.reference-link
  color ref-link-color

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
  margin-right 2em

#md-editor-v3-preview-wrapper
  padding 0 0 0 0


</style>
