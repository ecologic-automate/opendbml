<script setup lang="ts">
import { exporter } from '@dbml/core'

const {
  fileName,
  currentFile,
  files,
  sourceText,
  loadFile,
  saveFile,
  newFile,
  renameCurrentFile,
  deleteFile,
  canUndo,
  canRedo,
  undo,
  redo
} = useProjectState()

function handleFileSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value) void loadFile(value)
}

async function rename() {
  const next = window.prompt('Rename project', fileName.value)
  if (next?.trim()) await renameCurrentFile(next.trim())
}

async function importDbml() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dbml,.sql,.txt'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    sourceText.value = text
    await saveFile(file.name.replace(/\.[^.]+$/, ''))
  }
  input.click()
}

const EXPORT_FORMATS = [
  { label: 'DBML',        fmt: 'dbml',     ext: 'dbml',  mime: 'text/plain' },
  { label: 'PostgreSQL',  fmt: 'postgres',  ext: 'sql',   mime: 'text/plain' },
  { label: 'MySQL',       fmt: 'mysql',     ext: 'sql',   mime: 'text/plain' },
  { label: 'SQL Server',  fmt: 'mssql',     ext: 'sql',   mime: 'text/plain' },
  { label: 'JSON',        fmt: 'json',      ext: 'json',  mime: 'application/json' },
] as const

const exportError = ref('')

function exportAs(fmt: string, ext: string, mime: string) {
  exportError.value = ''
  try {
    const output = exporter.export(sourceText.value, fmt)
    const blob = new Blob([output], { type: `${mime};charset=utf-8` })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${fileName.value || 'schema'}.${ext}`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (e: any) {
    exportError.value = e?.message ?? 'Export failed'
    setTimeout(() => { exportError.value = '' }, 4000)
  }
}

async function duplicateCurrent() {
  await saveFile(`${fileName.value || 'Untitled'} (copy)`)
}

async function deleteCurrent() {
  if (!currentFile.value) return
  if (window.confirm(`Delete "${currentFile.value}"?`)) {
    await deleteFile(currentFile.value)
  }
}

function onKeydown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) {
    return
  }
  const key = e.key.toLowerCase()
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    return
  }
  if ((key === 'z' && e.shiftKey) || key === 'y') {
    e.preventDefault()
    redo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="topbar">
    <div class="left">
      <button class="icon-btn" aria-label="Back">&lt;</button>
      <button class="ghost" :disabled="!canUndo" title="Undo (Ctrl/Cmd+Z)" @click="undo">Undo</button>
      <button class="ghost" :disabled="!canRedo" title="Redo (Ctrl+Y / Cmd+Shift+Z)" @click="redo">Redo</button>
      <button class="name-chip" @click="rename">{{ fileName }}</button>
      <select class="file-select" :value="currentFile" @change="handleFileSelect">
        <option v-for="f in files" :key="f" :value="f">{{ f }}</option>
      </select>
    </div>

    <div class="right">
      <!-- Export menu -->
      <details class="project-menu">
        <summary class="ghost">Export</summary>
        <div class="menu-panel export-panel">
          <div class="export-section-label">Export as…</div>
          <button
            v-for="ef in EXPORT_FORMATS"
            :key="ef.fmt"
            class="export-btn"
            @click="exportAs(ef.fmt, ef.ext, ef.mime)"
          >
            <span class="export-label">{{ ef.label }}</span>
            <span class="export-ext">.{{ ef.ext }}</span>
          </button>
          <div v-if="exportError" class="export-error">{{ exportError }}</div>
        </div>
      </details>

      <!-- Project menu -->
      <details class="project-menu">
        <summary class="ghost">Project</summary>
        <div class="menu-panel">
          <button @click="newFile">New</button>
          <button @click="importDbml">Import DBML / SQL</button>
          <button @click="duplicateCurrent">Duplicate</button>
          <button @click="rename">Rename</button>
          <button @click="saveFile()">Save</button>
          <button class="danger" @click="deleteCurrent">Delete</button>
        </div>
      </details>
    </div>
  </header>
</template>
