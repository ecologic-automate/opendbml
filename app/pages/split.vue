<script setup lang="ts">
import { exporter } from '@dbml/core'

const { diagramTables, relationships, zoom, split, sourceText, parserError, updateTablePosition, addRelationshipBetween, deleteTable } = useProjectState()

const divider = computed({
  get: () => split.value,
  set: (v: number) => {
    split.value = Math.max(30, Math.min(75, v))
  }
})

const dragging = ref(false)

function down() {
  dragging.value = true
}

function move(e: PointerEvent) {
  if (!dragging.value) {
    return
  }
  divider.value = (e.clientX / window.innerWidth) * 100
}

function up() {
  dragging.value = false
}

function formatDbml() {
  try {
    sourceText.value = exporter.export(sourceText.value, 'dbml')
  } catch {
    // keep current text if formatting fails
  }
}

onMounted(() => {
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', move)
  window.removeEventListener('pointerup', up)
})
</script>

<template>
  <div class="split-wrap">
    <section class="split-left" :style="{ width: `${divider}%` }">
      <DiagramCanvas
        :tables="diagramTables"
        :relationships="relationships"
        :zoom="zoom"
        @move="updateTablePosition"
        @connect="addRelationshipBetween"
        @delete="deleteTable"
        @update:zoom="zoom = $event"
      />
    </section>
    <button class="split-divider" @pointerdown="down" />
    <section class="split-right" :style="{ width: `${100 - divider}%` }">
      <div class="code-head">
        <span>DBML Code</span>
        <button class="format-btn" @click="formatDbml">Format</button>
      </div>
      <DbmlEditor v-model="sourceText" />
      <div v-if="parserError" class="parse-error split">{{ parserError }}</div>
    </section>
  </div>
</template>
