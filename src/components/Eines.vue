<script setup>
import { useRouter } from 'vue-router'
import socket from '../socket'

// v-model:color i v-model:gruix que ve de SalaView
const color = defineModel('color')
const gruix = defineModel('gruix')

const router = useRouter()

function netejar() {
  socket.emit('clear_canvas')
}

function sortir() {
  router.push('/') // en tancar SalaView, ella mateixa avisa el servidor
}
</script>

<template>
  <div class="d-flex flex-column gap-2">
    <label class="form-label">
      Color
      <input v-model="color" type="color" class="form-control form-control-color w-100" />
    </label>
    <label class="form-label">
      Gruix: {{ gruix }}
      <input v-model.number="gruix" type="range" min="1" max="20" class="form-range" />
    </label>
    <button class="btn btn-outline-secondary" @click="netejar">Netejar</button>
    <button class="btn btn-outline-danger" @click="sortir">Sortir</button>
  </div>
</template>
