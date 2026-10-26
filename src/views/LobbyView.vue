<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const nom = ref('')
const sala = ref('')

function entrar() {
  if (nom.value.trim() === '' || sala.value.trim() === '') return

  router.push({ name: 'sala', params: { sala: sala.value.trim(), nom: nom.value.trim() } })
}
</script>

<template>
  <form class="card shadow-sm mx-auto" style="max-width: 400px;" @submit.prevent="entrar">
    <div class="card-body">
      <label class="form-label w-100">
        Nom
        <input v-model="nom" type="text" class="form-control" />
      </label>
      <label class="form-label w-100">
        Sala
        <input v-model="sala" type="text" class="form-control" />
      </label>
      <button class="btn btn-primary w-100 mt-2">Entrar</button>
    </div>
  </form>
</template>
