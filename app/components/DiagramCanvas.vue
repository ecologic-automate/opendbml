<script setup lang="ts">
import type { Field, Relationship, TableNode } from '~/composables/useProjectState'

const props = defineProps<{
  tables: TableNode[]
  relationships: Relationship[]
  zoom?: number
}>()

const emit = defineEmits<{
  move: [tableKey: string, x: number, y: number]
  'update:zoom': [zoom: number]
  connect: [sourceTableKey: string, sourceField: string, targetTableKey: string, targetField: string]
  delete: [tableKey: string]
}>()

const selected   = ref<string>('')
const dragging   = ref<string>('')
const dragOffset = ref({ x: 0, y: 0 })
const sectionRef = ref<HTMLElement | null>(null)
const connecting = ref<{ sourceKey: string; sourceName: string; sourceField: string } | null>(null)
const pointerCanvas = ref({ x: 0, y: 0 })
const scrollX    = ref(0)
const scrollY    = ref(0)

const scale = computed(() => (props.zoom ?? 55) / 100)

// ── Card geometry (must match CSS) ────────────────────────────────────────────
const TW = 240   // table width
const TH = 33    // header height
const RH = 28    // row height
const tableH = (t: TableNode) => TH + t.fields.length * RH

// ── Helpers ───────────────────────────────────────────────────────────────────
function norm(v: string) {
  return String(v || '').replace(/^"+|"+$/g, '').trim().toLowerCase()
}

function findTable(key: string, name: string) {
  return (
    props.tables.find(t => t.key === key) ||
    props.tables.find(t => norm(t.key) === norm(key)) ||
    props.tables.find(t => t.name === name) ||
    props.tables.find(t => norm(t.name) === norm(name))
  )
}

function anchorY(table: TableNode, col: string) {
  const idx = table.fields.findIndex(f => norm(f.name) === norm(col))
  if (idx < 0) return table.y + TH + (table.fields.length * RH) / 2
  return table.y + TH + idx * RH + RH / 2
}

// ── Relation data (path + dot coords) ─────────────────────────────────────────
const relData = computed(() =>
  props.relationships.map(rel => {
    const src = findTable(rel.sourceKey, rel.sourceTable)
    const tgt = findTable(rel.targetKey, rel.targetTable)
    if (!src || !tgt) return { id: rel.id, x1: 0, y1: 0, x2: 0, y2: 0, midX: 0, path: '' }
    const srcLeft = (src.x + TW / 2) <= (tgt.x + TW / 2)
    const x1   = srcLeft ? src.x + TW : src.x
    const y1   = anchorY(src, rel.sourceColumn)
    const x2   = srcLeft ? tgt.x      : tgt.x + TW
    const y2   = anchorY(tgt, rel.targetColumn)
    const midX = (x1 + x2) / 2
    return {
      id: rel.id, x1, y1, x2, y2, midX,
      path: `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`,
    }
  })
)

const draftPath = computed(() => {
  if (!connecting.value) return ''
  const src = findTable(connecting.value.sourceKey, connecting.value.sourceName)
  if (!src) return ''
  const x1 = src.x + TW
  const y1 = anchorY(src, connecting.value.sourceField)
  const x2 = pointerCanvas.value.x
  const y2 = pointerCanvas.value.y
  const midX = (x1 + x2) / 2
  return `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`
})

// ── Drag ─────────────────────────────────────────────────────────────────────
function toCanvas(cx: number, cy: number) {
  const s = sectionRef.value
  const r = s?.getBoundingClientRect() ?? { left: 0, top: 0 }
  return {
    x: ((cx - r.left) + (s?.scrollLeft ?? 0)) / scale.value,
    y: ((cy - r.top) + (s?.scrollTop ?? 0)) / scale.value
  }
}

function onPointerDown(e: PointerEvent, table: TableNode) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragging.value = table.key
  selected.value = table.id
  const c = toCanvas(e.clientX, e.clientY)
  dragOffset.value = { x: c.x - table.x, y: c.y - table.y }
}

function onPointerMove(e: PointerEvent) {
  const c = toCanvas(e.clientX, e.clientY)
  if (connecting.value) {
    pointerCanvas.value = c
  }
  if (!dragging.value) return
  emit('move', dragging.value,
    Math.max(20, c.x - dragOffset.value.x),
    Math.max(20, c.y - dragOffset.value.y))
}

function onPointerUp(e: PointerEvent) {
  dragging.value = ''
  if (!connecting.value) return
  const { sourceKey, sourceField } = connecting.value
  connecting.value = null
  const c = toCanvas(e.clientX, e.clientY)
  const targetTable = props.tables.find(t =>
    t.key !== sourceKey &&
    c.x >= t.x && c.x <= t.x + TW &&
    c.y >= t.y && c.y <= t.y + tableH(t)
  )
  if (!targetTable) return
  const fieldIdx = Math.floor((c.y - targetTable.y - TH) / RH)
  const targetField = targetTable.fields[fieldIdx]
  if (!targetField) return
  emit('connect', sourceKey, sourceField, targetTable.key, targetField.name)
}

function onDeleteTable(table: TableNode) {
  if (window.confirm(`Delete table "${table.name}"?`)) {
    emit('delete', table.key)
  }
}

function onLinkPointerDown(e: PointerEvent, table: TableNode, field: Field) {
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  connecting.value = { sourceKey: table.key, sourceName: table.name, sourceField: field.name }
  pointerCanvas.value = toCanvas(e.clientX, e.clientY)
}

// ── Ctrl + scroll zoom ────────────────────────────────────────────────────────
function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()
  emit('update:zoom', Math.min(150, Math.max(20, (props.zoom ?? 55) + (e.deltaY < 0 ? 5 : -5))))
}

// ── Minimap ───────────────────────────────────────────────────────────────────
const MM_W = 180
const MM_H = 124

/** Bounding box of all table cards in canvas coords (with padding) */
const bbox = computed(() => {
  if (!props.tables.length) return { x: 0, y: 0, w: 1400, h: 900 }
  const PAD = 80
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const t of props.tables) {
    minX = Math.min(minX, t.x);       minY = Math.min(minY, t.y)
    maxX = Math.max(maxX, t.x + TW);  maxY = Math.max(maxY, t.y + tableH(t))
  }
  return { x: minX - PAD, y: minY - PAD, w: maxX - minX + PAD * 2, h: maxY - minY + PAD * 2 }
})

const minimapViewBox = computed(() => `${bbox.value.x} ${bbox.value.y} ${bbox.value.w} ${bbox.value.h}`)

/** Viewport rectangle expressed in canvas coords */
const viewportRect = computed(() => {
  const s = sectionRef.value
  if (!s) return null
  return {
    x: s.scrollLeft / scale.value,
    y: s.scrollTop  / scale.value,
    w: s.clientWidth  / scale.value,
    h: s.clientHeight / scale.value,
  }
})

function onScroll() {
  scrollX.value = sectionRef.value?.scrollLeft ?? 0
  scrollY.value = sectionRef.value?.scrollTop  ?? 0
}

/** Click / drag on minimap → scroll canvas to that position */
let mmDragging = false
function mmPointerDown(e: PointerEvent) {
  mmDragging = true
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  mmNavigate(e)
}
function mmPointerMove(e: PointerEvent) { if (mmDragging) mmNavigate(e) }
function mmPointerUp()  { mmDragging = false }

function mmNavigate(e: PointerEvent) {
  const el   = (e.currentTarget as Element).getBoundingClientRect()
  const px   = (e.clientX - el.left)  / el.width
  const py   = (e.clientY - el.top)   / el.height
  const cx   = bbox.value.x + px * bbox.value.w
  const cy   = bbox.value.y + py * bbox.value.h
  const s    = sectionRef.value
  if (!s) return
  s.scrollLeft = Math.max(0, (cx - s.clientWidth  / scale.value / 2) * scale.value)
  s.scrollTop  = Math.max(0, (cy - s.clientHeight / scale.value / 2) * scale.value)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('pointermove',  onPointerMove)
  window.addEventListener('pointerup',    onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  sectionRef.value?.addEventListener('wheel',  onWheel,  { passive: false })
  sectionRef.value?.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove',   onPointerMove)
  window.removeEventListener('pointerup',     onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  sectionRef.value?.removeEventListener('wheel',  onWheel)
  sectionRef.value?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- dc-wrap is position:relative, no overflow — minimap anchors to it -->
  <div class="dc-wrap">
  <section ref="sectionRef" class="diagram-canvas">

    <!-- ── Scaled content ────────────────────────────────────────────────── -->
    <div class="canvas-viewport" :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }">

      <svg class="relations">
        <defs>
          <!-- Arrowhead marker -->
          <marker id="arrow-end" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(109,94,248,0.75)" />
          </marker>
        </defs>

        <g v-for="rd in relData" :key="rd.id">
          <!-- Wide invisible hitbox for hover/click -->
          <path :d="rd.path" fill="none" stroke="transparent" stroke-width="12" style="cursor:pointer" />
          <!-- Animated flowing dashed line -->
          <path
            :d="rd.path"
            class="rel-line"
            fill="none"
            marker-end="url(#arrow-end)"
          />
          <!-- Junction dots at elbow corners + endpoints -->
          <circle :cx="rd.x1"   :cy="rd.y1"  r="3"   class="rel-dot rel-dot--end" />
          <circle :cx="rd.midX" :cy="rd.y1"  r="2.5" class="rel-dot" />
          <circle :cx="rd.midX" :cy="rd.y2"  r="2.5" class="rel-dot" />
          <circle :cx="rd.x2"   :cy="rd.y2"  r="3"   class="rel-dot rel-dot--end" />
        </g>
        <path
          v-if="draftPath"
          :d="draftPath"
          class="rel-line rel-line--draft"
          fill="none"
          marker-end="url(#arrow-end)"
        />
      </svg>

      <article
        v-for="table in tables"
        :key="table.key"
        :data-table-key="table.key"
        class="table-card"
        :class="{ selected: selected === table.id }"
        :style="{ left: `${table.x}px`, top: `${table.y}px` }"
      >
        <header class="tc-head" @pointerdown="onPointerDown($event, table)">
          <span class="tc-name">{{ table.name }}</span>
          <button class="tc-delete-btn" title="Delete table" @pointerdown.stop @click.stop="onDeleteTable(table)">
            <AppIcon name="x" :size="10" />
          </button>
        </header>
        <ul class="tc-fields">
          <li
            v-for="(field, idx) in table.fields"
            :key="field.id"
            class="tc-row"
            :class="{
              'tc-row--pk':   field.isPrimaryKey,
              'tc-row--fk':   field.isForeignKey && !field.isPrimaryKey,
              'tc-row--even': idx % 2 === 1,
            }"
          >
            <span class="tc-left">
              <span class="tc-icon">
                <AppIcon v-if="field.isPrimaryKey"  name="key"   :size="11" class="icon-pk" />
                <AppIcon v-else-if="field.isForeignKey" name="link2" :size="11" class="icon-fk" />
                <span   v-else                          class="icon-dot" />
              </span>
              <span class="tc-field-name">{{ field.name }}</span>
            </span>
            <span class="tc-right">
              <span class="tc-type">{{ field.type }}</span>
              <span v-if="field.isNotNull && !field.isPrimaryKey" class="tc-nn">NN</span>
              <span v-if="field.isUnique  && !field.isPrimaryKey" class="tc-uq">UQ</span>
              <button
                class="tc-field-link"
                title="Drag to connect field"
                @pointerdown="onLinkPointerDown($event, table, field)"
              >
                <AppIcon name="link2" :size="9" />
              </button>
            </span>
          </li>
        </ul>
      </article>
    </div>

  </section>

  <!-- ── Minimap — anchored to dc-wrap, not the scroll section ─────────── -->
  <div class="mm-wrap">
      <div class="mm-header">
        <span>Overview</span>
        <span class="mm-zoom">{{ zoom ?? 55 }}%</span>
      </div>
      <svg
        class="mm-svg"
        :viewBox="minimapViewBox"
        preserveAspectRatio="xMidYMid meet"
        @pointerdown="mmPointerDown"
        @pointermove="mmPointerMove"
        @pointerup="mmPointerUp"
        @pointercancel="mmPointerUp"
      >
        <!-- Relation lines -->
        <path
          v-for="rd in relData"
          :key="rd.id"
          :d="rd.path"
          fill="none"
          class="mm-rel"
        />
        <!-- Table rectangles -->
        <rect
          v-for="t in tables"
          :key="t.key"
          :x="t.x" :y="t.y"
          :width="TW"
          :height="tableH(t)"
          class="mm-table"
          :class="{ 'mm-table--selected': selected === t.id }"
        />
        <!-- Viewport rectangle -->
        <rect
          v-if="viewportRect"
          :x="viewportRect.x" :y="viewportRect.y"
          :width="viewportRect.w" :height="viewportRect.h"
          class="mm-viewport"
        />
      </svg>
    </div>

  </div><!-- end dc-wrap -->
</template>
