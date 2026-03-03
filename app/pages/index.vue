<script setup lang="ts">
const { diagramTables, relationships, zoom, parserError, updateTablePosition, autoLayout, addRelationshipBetween, deleteTable } = useProjectState()

function fitToScreen() {
  zoom.value = 55
}
</script>

<template>
  <div class="diagram-page">
    <DiagramCanvas
      :tables="diagramTables"
      :relationships="relationships"
      :zoom="zoom"
      @move="updateTablePosition"
      @connect="addRelationshipBetween"
      @delete="deleteTable"
      @update:zoom="zoom = $event"
    />

    <div v-if="parserError" class="parse-error">{{ parserError }}</div>

    <div class="controls-dock">
      <button @click="autoLayout">Auto-layout</button>
      <button @click="fitToScreen">Fit to screen</button>
      <label>
        Zoom
        <input v-model="zoom" type="range" min="30" max="120" step="1">
        <span>{{ zoom }}%</span>
      </label>
    </div>
  </div>
</template>
