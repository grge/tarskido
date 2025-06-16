
<template>
<div class='graph-options-menu-button' @click="toggleMenu">⚙</div>
<div class='graph-options-menu' v-if="menuVisible">
  <el-form label-width="auto" class="menu-form" :model="graphOptions" size="small">
    <div class="menu-header">
      <span>Graph Options</span>
      <el-divider></el-divider>
    </div>

    <el-form-item label="Animate">
      <el-switch v-model="graphOptions.animate" label="Animate" size="small"/>
    </el-form-item>
    <el-tooltip content="Remove transitive edges to simplify the graph" placement="right" theme="light">
    <el-form-item label="Reduce Edges">
      <el-switch v-model="graphOptions.reduceEdges" label="Clean Edges" size="small"/>
    </el-form-item>
    </el-tooltip>
    <el-form-item label="Context Collapse Level">
      <el-slider v-model="graphOptions.contextCollapseLevel" :min="0" :max="5" :step="1" />
    </el-form-item>
    <el-form-item label="Outside Collapse Level">
      <el-slider v-model="graphOptions.outsideCollapseLevel" :min="-2" :max="2" :step="1" />
    </el-form-item>
    <el-form-item label="Parents">
      <el-radio-group v-model="showParentsMode">
        <el-radio-button value="None" label="None"/>
        <el-radio-button value="Most" label="Most"/>
        <el-radio-button value="All"  label="All"/>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="Predecessor Depth">
      <el-slider v-model="graphOptions.predecessorRadius" :min="0" :max="10" :step="1" />
    </el-form-item>
    <el-form-item label="Successor Depth">
      <el-slider v-model="graphOptions.successorRadius" :min="0" :max="10" :step="1" />
    </el-form-item>
  </el-form>
</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

const showParentsMode = ref<'None' | 'Most' | 'All'>('Most')

watch(showParentsMode, (newMode) => {
  const go = props.graphOptions
  if (newMode === 'None') {
    go.includeParents = false
    go.pruneSingleChildParents = true
  } else if (newMode === 'Most') {
    go.includeParents = true
    go.pruneSingleChildParents = true
  } else {
    go.includeParents = true
    go.pruneSingleChildParents = false
  }
})

const menuVisible = ref(false)

const props = defineProps<{ graphOptions: any }>()

</script>

<style scoped lang="stylus">
.graph-options-menu-button
  position absolute
  right 20%
  top -17px
  z-index 1000
  margin 0
  padding 0 0.2em
  font-size 1.6em
  cursor pointer
  color #6aa84f
  background-color white

.graph-options-menu
  font-family sans
  position absolute
  padding 2em
  z-index 999
  background-color rgba(255, 255, 255, 0.6)
  box-shadow 0 0 10px rgba(0, 0, 0, 0.1)
  backdrop-filter blur(5px)
  right calc(20% - 4px)
  top -19px
  border 1px solid #6aa84f
  border-radius 8px
  --el-color-primary: #6aa84f;
  transition all 0.3s ease-in-out

.menu-form
  width 290px

.menu-actions
  text-align right
</style>
