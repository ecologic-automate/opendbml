<script setup lang="ts">
const route = useRoute()
const showTopbar = computed(() => route.path !== '/settings')
const { initialize } = useProjectState()

onMounted(() => {
  void initialize()
})
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="main-area">
      <AppTopbar v-if="showTopbar" />
      <div class="page-area">
        <slot />
      </div>
    </main>
  </div>
</template>
