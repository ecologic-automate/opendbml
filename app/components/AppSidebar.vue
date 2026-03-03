<script setup lang="ts">
const route = useRoute()
const { addTable } = useProjectState()

const items = [
  { label: 'Tables', to: '/', icon: 'layout-grid' },
  { label: 'Split', to: '/split', icon: 'layout-grid' },
  { label: 'Views', to: '/views', icon: 'eye' },
  { label: 'Relationships', to: '/relationships', icon: 'git-branch' },
  { label: 'Settings', to: '/settings', icon: 'settings' }
] as const

const showAdd = computed(() => route.path === '/' || route.path === '/split')
</script>

<template>
  <aside class="sidebar">
    <div class="logo-badge">
      <AppIcon name="table2" :size="18" />
    </div>

    <nav class="menu">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="menu-item"
        :class="{ active: route.path === item.to }"
      >
        <AppIcon :name="item.icon" :size="18" />
        <span class="menu-label">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <button v-if="showAdd" class="fab" title="Add Table" @click="addTable">
      <AppIcon name="plus" :size="18" />
    </button>
  </aside>
</template>
