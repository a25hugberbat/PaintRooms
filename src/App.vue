<script setup>
import {ref} from 'vue'
import Lobby from './components/Lobby.vue'
import Room from './components/Room.vue'
import { socket } from './socket'

const usuario = ref(null) //aquí se guarda { username, roomName } al entrar
</script>

<template>
  <Lobby v-if="!usuario" @entrar="/*"
</template>

<style scoped></style>
