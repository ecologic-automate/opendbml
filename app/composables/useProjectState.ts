import { Parser } from '@dbml/core'

export type Field = {
  id: string
  name: string
  type: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  isNotNull?: boolean
  isUnique?: boolean
}

export type TableNode = {
  id: string
  key: string
  name: string
  schema: string
  x: number
  y: number
  fields: Field[]
}

export type Relationship = {
  id: string
  sourceKey: string
  targetKey: string
  sourceTable: string
  sourceColumn: string
  targetTable: string
  targetColumn: string
  cardinality: '1:N' | '1:1' | 'N:N'
  type: 'FK' | 'PK' | 'INDEX'
}

export type ViewRow = {
  id: string
  name: string
  schema: string
  sourceTables: string[]
  lastModified: string
  status: 'active' | 'inactive'
}

type StoredFile = {
  sourceText: string
  zoom: number
  split: number
  tablePositions: Record<string, { x: number; y: number }>
}

type EditorSnapshot = {
  sourceText: string
  zoom: number
  split: number
  tablePositions: Record<string, { x: number; y: number }>
}

const defaultSource = `Table users {
  id int [pk, increment]
  username string
  email string [unique]
  created_at datetime
}

Table orders {
  id int [pk, increment]
  user_id int
  status string
  total decimal
  created_at datetime
}

Table products {
  id int [pk, increment]
  name string
  category_id int
  price decimal
  quantity int
}

Table order_items {
  id int [pk, increment]
  order_id int
  product_id int
  quantity int
  price decimal
}

Table categories {
  id int [pk, increment]
  name string
  parent_id int [null]
}

Ref: orders.user_id > users.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id
Ref: products.category_id > categories.id
Ref: categories.parent_id > categories.id`

const sampleViews: ViewRow[] = [
  { id: 'v1', name: 'active_users', schema: 'public', sourceTables: ['users'], lastModified: '2 hours ago', status: 'active' },
  { id: 'v2', name: 'pending_orders', schema: 'sales', sourceTables: ['orders', 'order_items'], lastModified: 'Yesterday', status: 'active' },
  { id: 'v3', name: 'product_catalog', schema: 'public', sourceTables: ['products', 'categories'], lastModified: '3 days ago', status: 'inactive' }
]

let fileStorePromise: Promise<any> | null = null

async function getFileStore() {
  if (!import.meta.client) {
    return null
  }
  if (!fileStorePromise) {
    fileStorePromise = import('localforage').then((m) =>
      m.default.createInstance({
        name: 'ecoschema',
        storeName: 'files'
      })
    )
  }
  return fileStorePromise
}

function getCardinality(left: string, right: string): '1:N' | '1:1' | 'N:N' {
  const l = left === '1' ? '1' : 'N'
  const r = right === '1' ? '1' : 'N'
  return `${l}:${r}` as '1:N' | '1:1' | 'N:N'
}

function formatFieldType(typeValue: any): string {
  if (!typeValue) {
    return 'unknown'
  }
  if (typeof typeValue === 'string') {
    return typeValue
  }
  if (typeof typeValue === 'object') {
    if (typeof typeValue.type_name === 'string' && typeValue.type_name.length > 0) {
      const schemaPrefix = typeValue.schemaName ? `${typeValue.schemaName}.` : ''
      return `${schemaPrefix}${typeValue.type_name}`
    }
    if (typeof typeValue.raw === 'string') {
      return typeValue.raw
    }
  }
  return String(typeValue)
}

export function useProjectState() {
  const fileName = useState('fileName', () => 'e-commerce_schema')
  const currentFile = useState('currentFile', () => '')
  const files = useState<string[]>('files', () => [])
  const zoom = useState('zoom', () => 55)
  const split = useState('split', () => 56)
  const sourceText = useState('sourceText', () => defaultSource)
  const parserError = useState<string>('parserError', () => '')
  const lastSave = useState<number>('lastSave', () => 0)
  const initialized = useState('projectInitialized', () => false)
  const database = useState<any>('database', () => ({ schemas: [] }))
  const tablePositions = useState<Record<string, { x: number; y: number }>>('tablePositions', () => ({}))
  const views = useState<ViewRow[]>('views', () => sampleViews)
  const undoStack = useState<EditorSnapshot[]>('undoStack', () => [])
  const redoStack = useState<EditorSnapshot[]>('redoStack', () => [])
  const historyPaused = useState('historyPaused', () => false)

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function ensureTablePosition(tableKey: string, fallbackIndex: number) {
    if (!tablePositions.value[tableKey]) {
      tablePositions.value[tableKey] = {
        x: 120 + (fallbackIndex % 3) * 320,
        y: 100 + Math.floor(fallbackIndex / 3) * 250
      }
    }
  }

  function parseSource() {
    try {
      const parsed = Parser.parse(sourceText.value || '', 'dbml')
      parsed.normalize()
      database.value = parsed
      parserError.value = ''

      let idx = 0
      for (const schema of parsed.schemas || []) {
        for (const table of schema.tables || []) {
          const key = `${schema.name || 'public'}.${table.name}`
          ensureTablePosition(key, idx++)
        }
      }
    } catch (err: any) {
      database.value = { schemas: [] }
      parserError.value = err?.message || 'DBML parse error'
    }
  }

  function makeSnapshot(): EditorSnapshot {
    return {
      sourceText: sourceText.value,
      zoom: zoom.value,
      split: split.value,
      tablePositions: JSON.parse(JSON.stringify(tablePositions.value || {}))
    }
  }

  function applySnapshot(snapshot: EditorSnapshot) {
    historyPaused.value = true
    sourceText.value = snapshot.sourceText
    zoom.value = snapshot.zoom
    split.value = snapshot.split
    tablePositions.value = JSON.parse(JSON.stringify(snapshot.tablePositions || {}))
    parseSource()
    historyPaused.value = false
  }

  function clearHistory() {
    undoStack.value = []
    redoStack.value = []
  }

  function undo() {
    if (!undoStack.value.length) {
      return
    }
    const previous = undoStack.value.pop()
    if (!previous) {
      return
    }
    redoStack.value.push(makeSnapshot())
    applySnapshot(previous)
  }

  function redo() {
    if (!redoStack.value.length) {
      return
    }
    const next = redoStack.value.pop()
    if (!next) {
      return
    }
    undoStack.value.push(makeSnapshot())
    applySnapshot(next)
  }

  const diagramTables = computed<TableNode[]>(() => {
    const output: TableNode[] = []
    for (const schema of database.value?.schemas || []) {
      for (const table of schema.tables || []) {
        const key = `${schema.name || 'public'}.${table.name}`
        const pos = tablePositions.value[key] || { x: 120, y: 100 }
        output.push({
          id: String(table.id),
          key,
          name: table.name,
          schema: schema.name || 'public',
          x: pos.x,
          y: pos.y,
          fields: (table.fields || []).map((field: any) => ({
            id: String(field.id),
            name: field.name,
            type: formatFieldType(field.type),
            isPrimaryKey: !!field.pk,
            isForeignKey: Array.isArray(field.endpoints) && field.endpoints.length > 0,
            isNotNull: !!field.not_null || !!field.pk,
            isUnique: !!field.unique
          }))
        })
      }
    }
    return output
  })

  const relationships = computed<Relationship[]>(() => {
    const output: Relationship[] = []
    for (const schema of database.value?.schemas || []) {
      for (const ref of schema.refs || []) {
        if (!ref.endpoints || ref.endpoints.length < 2) {
          continue
        }
        const a = ref.endpoints[0]
        const b = ref.endpoints[1]
        const sourceSchema = a.schemaName || schema.name || 'public'
        const targetSchema = b.schemaName || schema.name || 'public'
        output.push({
          id: String(ref.id),
          sourceKey: `${sourceSchema}.${a.tableName}`,
          targetKey: `${targetSchema}.${b.tableName}`,
          sourceTable: a.tableName,
          sourceColumn: a.fieldNames?.[0] || '',
          targetTable: b.tableName,
          targetColumn: b.fieldNames?.[0] || '',
          cardinality: getCardinality(a.relation, b.relation),
          type: 'FK'
        })
      }
    }
    return output
  })

  function findDbTableByKey(tableKey: string) {
    for (const schema of database.value?.schemas || []) {
      for (const table of schema.tables || []) {
        const key = `${schema.name || 'public'}.${table.name}`
        if (key === tableKey) {
          return { schema, table, key }
        }
      }
    }
    return null
  }

  function toTableLabel(schemaName: string, tableName: string) {
    return schemaName && schemaName !== 'public' ? `${schemaName}.${tableName}` : tableName
  }

  function appendRefText(input: string, refLine: string) {
    const base = input.trimEnd()
    return `${base}\n\n${refLine}\n`
  }

  function deleteTable(tableKey: string) {
    const found = findDbTableByKey(tableKey)
    if (!found) return

    const { table, schema } = found
    const tableName = table.name

    // Remove position entry
    const newPositions = { ...tablePositions.value }
    delete newPositions[tableKey]
    tablePositions.value = newPositions

    // Remove the Table block from source text
    const lines = sourceText.value.split('\n')
    const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const headerRe = new RegExp(`^\\s*[Tt]able\\s+(?:[^{]*\\.)?["'\`]?${escaped}["'\`]?\\s*\\{`)
    const headerIdx = lines.findIndex(l => headerRe.test(l))

    if (headerIdx >= 0) {
      let depth = 0
      let closingIdx = -1
      for (let i = headerIdx; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === '{') depth++
          else if (ch === '}') { depth--; if (depth === 0) { closingIdx = i; break } }
        }
        if (closingIdx >= 0) break
      }
      if (closingIdx >= 0) {
        // Also remove any blank lines immediately before the block
        let startIdx = headerIdx
        while (startIdx > 0 && lines[startIdx - 1].trim() === '') startIdx--
        lines.splice(startIdx, closingIdx - startIdx + 1)
      }
    }

    // Remove Ref lines that mention this table (matches tableName. anywhere in the line)
    const refNameRe = new RegExp(`\\b${escaped}\\.`)
    const cleaned = lines
      .filter(l => !(l.trimStart().toLowerCase().startsWith('ref') && refNameRe.test(l)))

    sourceText.value = cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
  }

  function updateTablePosition(tableKey: string, x: number, y: number) {
    tablePositions.value[tableKey] = { x, y }
  }

  function addTable() {
    const count = diagramTables.value.length + 1
    const name = `new_table_${count}`
    sourceText.value = sourceText.value.trimEnd() + `\n\nTable ${name} {\n  id int [pk, increment]\n}\n`
  }

  function addRelationshipBetween(
    sourceKey: string,
    sourceField: string,
    targetKey: string,
    targetField: string
  ) {
    if (!sourceKey || !targetKey || sourceKey === targetKey || !sourceField || !targetField) return

    const sourceDb = findDbTableByKey(sourceKey)
    const targetDb = findDbTableByKey(targetKey)
    if (!sourceDb || !targetDb) return

    const sourceLabel = toTableLabel(sourceDb.schema.name || 'public', sourceDb.table.name)
    const targetLabel = toTableLabel(targetDb.schema.name || 'public', targetDb.table.name)
    const refLine = `Ref: ${sourceLabel}.${sourceField} > ${targetLabel}.${targetField}`

    if (!sourceText.value.includes(refLine)) {
      sourceText.value = appendRefText(sourceText.value, refLine)
    }
  }

  function autoLayout() {
    diagramTables.value.forEach((table, index) => {
      tablePositions.value[table.key] = {
        x: 100 + (index % 3) * 330,
        y: 90 + Math.floor(index / 3) * 250
      }
    })
  }

  async function loadFileList() {
    const store = await getFileStore()
    if (!store) {
      return
    }
    files.value = await store.keys()
  }

  async function loadFile(name: string) {
    const store = await getFileStore()
    if (!store) {
      return
    }
    const file = (await store.getItem(name)) as StoredFile | null
    if (!file) {
      return
    }

    historyPaused.value = true
    currentFile.value = name
    fileName.value = name
    sourceText.value = file.sourceText || defaultSource
    zoom.value = file.zoom ?? 55
    split.value = file.split ?? 56
    tablePositions.value = file.tablePositions || {}
    parseSource()
    clearHistory()
    historyPaused.value = false
  }

  async function saveFile(name?: string) {
    const store = await getFileStore()
    if (!store) {
      return
    }

    let target = name || currentFile.value
    if (!target) {
      target = `Untitled (${files.value.length + 1})`
    }

    const payload: StoredFile = {
      sourceText: sourceText.value,
      zoom: zoom.value,
      split: split.value,
      tablePositions: tablePositions.value
    }

    await store.setItem(target, JSON.parse(JSON.stringify(payload)))
    currentFile.value = target
    fileName.value = target
    lastSave.value = Date.now()
    await loadFileList()
  }

  async function deleteFile(name: string) {
    const store = await getFileStore()
    if (!store || !name) {
      return
    }
    await store.removeItem(name)
    await loadFileList()
    if (currentFile.value === name) {
      if (files.value.length > 0) {
        await loadFile(files.value[0])
      } else {
        currentFile.value = ''
        fileName.value = 'e-commerce_schema'
        sourceText.value = defaultSource
        parseSource()
      }
    }
  }

  async function renameCurrentFile(nextName: string) {
    const old = currentFile.value
    if (!nextName.trim()) {
      return
    }
    await saveFile(nextName.trim())
    if (old && old !== nextName.trim()) {
      await deleteFile(old)
    }
  }

  async function newFile() {
    historyPaused.value = true
    sourceText.value = defaultSource
    tablePositions.value = {}
    parseSource()
    currentFile.value = ''
    clearHistory()
    historyPaused.value = false
    await saveFile()
  }

  async function initialize() {
    if (initialized.value || !import.meta.client) {
      return
    }
    initialized.value = true
    parseSource()
    await loadFileList()
    if (files.value.length > 0) {
      await loadFile(files.value[0])
    } else {
      await saveFile('Untitled')
    }
  }

  let parseTimer: ReturnType<typeof setTimeout> | undefined
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  watch(sourceText, () => {
    if (parseTimer) {
      clearTimeout(parseTimer)
    }
    parseTimer = setTimeout(parseSource, 120)
  })

  watch(
    () => JSON.stringify(makeSnapshot()),
    (next, prev) => {
      if (!initialized.value || historyPaused.value || !prev || next === prev) {
        return
      }
      undoStack.value.push(JSON.parse(prev) as EditorSnapshot)
      if (undoStack.value.length > 100) {
        undoStack.value.shift()
      }
      redoStack.value = []
    },
    { flush: 'sync' }
  )

  watch([sourceText, tablePositions, zoom, split], () => {
    if (!import.meta.client || !initialized.value) {
      return
    }
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      void saveFile(currentFile.value)
    }, 700)
  }, { deep: true })

  return {
    fileName,
    currentFile,
    files,
    zoom,
    split,
    sourceText,
    parserError,
    lastSave,
    views,
    diagramTables,
    relationships,
    initialize,
    updateTablePosition,
    addTable,
    deleteTable,
    addRelationshipBetween,
    autoLayout,
    loadFileList,
    loadFile,
    saveFile,
    deleteFile,
    renameCurrentFile,
    newFile,
    canUndo,
    canRedo,
    undo,
    redo
  }
}
