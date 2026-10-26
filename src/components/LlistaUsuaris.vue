<script setup>
defineProps(['usuaris'])
</script>

<template>
  <h3 class="h6 mt-3 mb-1">Usuaris</h3>
  <ul class="list-group">
    <li
      v-for="(u, index) in usuaris"
      :key="index"
      class="list-group-item"
      :style="{ color: u.color }"
    >
      {{ u.username }}
    </li>
  </ul>
</template>
