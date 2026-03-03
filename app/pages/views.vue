<script setup lang="ts">
const { views } = useProjectState()
const search = ref('')
const selected = ref('')

const filtered = computed(() => views.value.filter((v) => {
  const q = search.value.toLowerCase()
  return v.name.toLowerCase().includes(q) || v.schema.toLowerCase().includes(q)
}))
</script>

<template>
  <section class="table-page">
    <div class="table-headline">
      <h1>Views Management Table</h1>
      <input v-model="search" placeholder="Search views...">
    </div>

    <div class="table-frame">
      <table>
        <thead>
          <tr>
            <th>View Name</th>
            <th>Schema</th>
            <th>Source Tables</th>
            <th>Last Modified</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="view in filtered"
            :key="view.id"
            :class="{ selected: selected === view.id }"
            @click="selected = view.id"
          >
            <td>{{ view.name }}</td>
            <td>{{ view.schema }}</td>
            <td>{{ view.sourceTables.join(', ') }}</td>
            <td>{{ view.lastModified }}</td>
            <td>
              <span class="pill" :class="view.status">{{ view.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
