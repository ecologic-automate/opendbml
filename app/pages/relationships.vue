<script setup lang="ts">
const { relationships } = useProjectState()
const search = ref('')
const selected = ref('')

const filtered = computed(() => relationships.value.filter((r) => {
  const q = search.value.toLowerCase()
  return `${r.sourceTable} ${r.targetTable} ${r.sourceColumn} ${r.targetColumn}`.toLowerCase().includes(q)
}))
</script>

<template>
  <section class="table-page">
    <div class="table-headline">
      <h1>Relationships Table</h1>
      <input v-model="search" placeholder="Search relationships...">
    </div>

    <div class="table-frame">
      <table>
        <thead>
          <tr>
            <th>Source Table</th>
            <th>Source Column</th>
            <th>Target Table</th>
            <th>Target Column</th>
            <th>Cardinality</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="rel in filtered"
            :key="rel.id"
            :class="{ selected: selected === rel.id }"
            @click="selected = rel.id"
          >
            <td>{{ rel.sourceTable }}</td>
            <td>{{ rel.sourceColumn }}</td>
            <td>{{ rel.targetTable }}</td>
            <td>{{ rel.targetColumn }}</td>
            <td>{{ rel.cardinality }}</td>
            <td><span class="fk">{{ rel.type }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
