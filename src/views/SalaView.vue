<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import socket from '../socket'
import Pissarra from '../components/Pissarra.vue'
import Eines from '../components/Eines.vue'
import LlistaUsuaris from '../components/LlistaUsuaris.vue'

const route = useRoute()
const sala = route.params.sala
const nom = route.params.nom

const color = ref('#000000')
const gruix = ref(3)
const usuaris = ref([])

onMounted(() => {
  socket.on('room_users', (llista) => {
    usuaris.value = llista
  })

  socket.emit('join_room', { roomName: sala, username: nom })
})

onUnmounted(() => {
  socket.emit('leave_room')
  socket.off('room_users')
})
</script>

<template>
  <div class="d-flex flex-wrap gap-4 justify-content-center">
    <div>
      <h2 class="h5">Sala: {{ sala }}</h2>
      <Pissarra :color="color" :gruix="gruix" />
    </div>

    <div class="card shadow-sm align-self-start" style="width: 220px;">
      <div class="card-body">
        <Eines v-model:color="color" v-model:gruix="gruix" />
        <LlistaUsuaris :usuaris="usuaris" />
      </div>
    </div>
  </div>
</template>
