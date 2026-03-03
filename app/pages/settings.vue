<script setup lang="ts">
const { fileName } = useProjectState()
const tab = ref<'general' | 'appearance' | 'account' | 'integrations' | 'shortcuts'>('general')
const autoSave = ref(true)
const darkMode = ref(true)
const gridVisible = ref(true)
const syncEnabled = ref(false)
const dbType = ref('PostgreSQL')
const accent = ref('#6D5EF8')
</script>

<template>
  <section class="settings-wrap">
    <aside class="settings-nav">
      <button :class="{ active: tab === 'general' }" @click="tab = 'general'">General</button>
      <button :class="{ active: tab === 'appearance' }" @click="tab = 'appearance'">Appearance</button>
      <button :class="{ active: tab === 'account' }" @click="tab = 'account'">Account</button>
      <button :class="{ active: tab === 'integrations' }" @click="tab = 'integrations'">Integrations</button>
      <button :class="{ active: tab === 'shortcuts' }" @click="tab = 'shortcuts'">Keyboard Shortcuts</button>
    </aside>

    <div class="settings-main">
      <div v-if="tab === 'general'" class="settings-panel">
        <h2>General Settings</h2>
        <label>Project Name <input v-model="fileName"></label>
        <label>Default Database Type
          <select v-model="dbType">
            <option>PostgreSQL</option>
            <option>MySQL</option>
            <option>SQLite</option>
            <option>SQL Server</option>
          </select>
        </label>
        <label class="switch-line"><span>Auto-save</span><input v-model="autoSave" type="checkbox"></label>
        <div class="storage">
          <h3>Storage</h3>
          <p>Local storage enabled (IndexedDB)</p>
          <label class="switch-line"><span>Optional Sync</span><input v-model="syncEnabled" type="checkbox"></label>
        </div>
      </div>

      <div v-if="tab === 'appearance'" class="settings-panel">
        <h2>Appearance</h2>
        <label class="switch-line"><span>Dark Mode</span><input v-model="darkMode" type="checkbox"></label>
        <label class="switch-line"><span>Grid Visibility</span><input v-model="gridVisible" type="checkbox"></label>
        <label>Accent Color <input v-model="accent" type="color"></label>
      </div>
    </div>
  </section>
</template>
