<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const preRef      = ref<HTMLPreElement      | null>(null)
const gutterRef   = ref<HTMLDivElement      | null>(null)

const text = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const lineCount = computed(() => text.value.split('\n').length)

// ── Tokeniser ────────────────────────────────────────────────────────────────

type TokenType = 'comment' | 'string' | 'structure' | 'modifier' | 'type' | 'operator' | 'brace' | 'text'
interface Token { type: TokenType; value: string }

const PATTERNS: [RegExp, TokenType][] = [
  [/^\/\/.*/, 'comment'],
  [/^('''[\s\S]*?'''|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)/, 'string'],
  [/^(?:Project|Table|TableGroup|Ref|enum|indexes|Note)\b/i, 'structure'],
  [/^(?:pk|not\s+null|null|increment|default|unique|primary\s+key)\b/i, 'modifier'],
  [/^(?:int|integer|bigint|tinyint|smallint|varchar|char|text|boolean|bool|decimal|numeric|float|double|datetime|timestamp|timestamptz|date|time|uuid|json|jsonb|money|bit|binary|blob|string)\b/i, 'type'],
  [/^[<>\-]/, 'operator'],
  [/^[{}[\]]/, 'brace'],
]

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let rest = line
  while (rest.length > 0) {
    let matched = false
    for (const [re, type] of PATTERNS) {
      const m = rest.match(re)
      if (m) {
        tokens.push({ type, value: m[0] })
        rest = rest.slice(m[0].length)
        matched = true
        break
      }
    }
    if (!matched) {
      const last = tokens.at(-1)
      if (last?.type === 'text') last.value += rest[0]
      else tokens.push({ type: 'text', value: rest[0] })
      rest = rest.slice(1)
    }
  }
  return tokens
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlighted = computed(() =>
  text.value
    .split('\n')
    .map((line) =>
      tokenizeLine(line)
        .map((t) => t.type === 'text' ? esc(t.value) : `<span class="hl-${t.type}">${esc(t.value)}</span>`)
        .join('')
    )
    .join('\n') + '\n'
)

// ── Sync scroll (gutter + highlight layer follow textarea) ───────────────────
function syncScroll() {
  const ta = textareaRef.value
  if (!ta) return
  if (preRef.value) {
    preRef.value.scrollTop  = ta.scrollTop
    preRef.value.scrollLeft = ta.scrollLeft
  }
  if (gutterRef.value) {
    gutterRef.value.scrollTop = ta.scrollTop
  }
}
</script>

<template>
  <div class="dbml-editor">
    <!-- Line-number gutter -->
    <div ref="gutterRef" class="dbml-gutter" aria-hidden="true">
      <div v-for="n in lineCount" :key="n" class="dbml-ln">{{ n }}</div>
    </div>

    <!-- Highlight + input overlay -->
    <div class="dbml-body">
      <pre ref="preRef" class="dbml-hl" aria-hidden="true"><code v-html="highlighted" /></pre>
      <textarea
        ref="textareaRef"
        v-model="text"
        class="dbml-ta"
        spellcheck="false"
        autocomplete="off"
        @scroll="syncScroll"
      />
    </div>
  </div>
</template>
