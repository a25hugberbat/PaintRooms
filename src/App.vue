<script setup>
import { reactive, ref, nextTick, onMounted } from 'vue'
import { io } from 'socket.io-client'

// 1. Connexió amb el servidor
const socket = io('http://localhost:3000')

// 2. Les dades de l'aplicació (reactive = si canvien, la pantalla s'actualitza)
const data = reactive({
  username: '',
  roomName: '',
  dinsSala: false,
  usuaris: [],      // [{ username, color }]
  cursors: {},      // cursors[id] = { x, y, username, color }
  color: '#000000',
  gruix: 3
})

// 3. El canvas i el "llapis"
const canvas = ref(null)
let ctx = null

// 4. El meu traç
let pintant = false
let ultim = null

// 5. Els tracos dels altres (un per persona)
const llapis = {}   // llapis[id] = { x, y, color, width }

// Dibuixa una línia d'un punt a un altre
function linia(des, fins, color, width) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(des.x, des.y)
  ctx.lineTo(fins.x, fins.y)
  ctx.stroke()
}

// Pinta els tracos guardats que envia el servidor en entrar
function pintarTracos(tracos) {
  for (const t of tracos) {
    linia(t.punts[0], t.punts[0], t.color, t.width)
    for (let i = 1; i < t.punts.length; i++) {
      linia(t.punts[i - 1], t.punts[i], t.color, t.width)
    }
  }
}

// Botó Entrar
async function entrar() {
  data.username = data.username.trim()
  data.roomName = data.roomName.trim()
  if (data.username === '' || data.roomName === '') return

  // Ho guardem per si es refresca la pàgina
  sessionStorage.setItem('paintrooms', JSON.stringify({ username: data.username, roomName: data.roomName }))

  data.dinsSala = true
  await nextTick()   // esperem que el canvas existeixi a la pantalla
  ctx = canvas.value.getContext('2d')

  socket.emit('join_room', { roomName: data.roomName, username: data.username }, (estat) => {
    pintarTracos(estat.tracos)
  })
}

// Ratolí / dit sobre el canvas
function comencar(e) {
  pintant = true
  ultim = { x: e.offsetX, y: e.offsetY }
  linia(ultim, ultim, data.color, data.gruix)
  socket.emit('draw_begin', { x: ultim.x, y: ultim.y, color: data.color, width: data.gruix })
}

function moure(e) {
  const punt = { x: e.offsetX, y: e.offsetY }
  socket.emit('cursor_move', punt)

  if (!pintant) return
  linia(ultim, punt, data.color, data.gruix)
  ultim = punt
  socket.emit('draw_move', punt)
}

function acabar() {
  if (!pintant) return
  pintant = false
  socket.emit('draw_end', {})
}

// Botó Netejar
function netejar() {
  socket.emit('clear_canvas', {})
}

// Botó Desconnectar
function desconnectar() {
  socket.disconnect()   // el servidor ens treu de la sala i avisa la resta
  socket.connect()      // tornem a tenir connexió per poder entrar a una altra sala

  sessionStorage.removeItem('paintrooms')   // ja no volem tornar a entrar en refrescar

  // Deixem les dades com al principi
  data.dinsSala = false
  data.roomName = ''
  data.usuaris = []
  data.cursors = {}
  pintant = false
  for (const id in llapis) delete llapis[id]
}

// 6. Missatges del servidor
socket.on('clear_canvas', (estat) => {
  ctx.clearRect(0, 0, 800, 500)
  pintarTracos(estat.tracos)
})

socket.on('room_users', (llista) => {
  data.usuaris = llista
})

socket.on('cursor_move', (c) => {
  data.cursors[c.id] = c
})

socket.on('draw_begin', (d) => {
  llapis[d.id] = d
  linia(d, d, d.color, d.width)
})

socket.on('draw_move', (d) => {
  const l = llapis[d.id]
  if (!l) return
  linia(l, d, l.color, l.width)
  l.x = d.x
  l.y = d.y
})

socket.on('draw_end', (d) => {
  delete llapis[d.id]
})

socket.on('user_left', (d) => {
  delete data.cursors[d.id]
  delete llapis[d.id]
})

// 7. Si s'ha refrescat la pàgina, tornem a entrar a la mateixa sala
onMounted(() => {
  const guardat = sessionStorage.getItem('paintrooms')
  if (guardat) {
    const { username, roomName } = JSON.parse(guardat)
    data.username = username
    data.roomName = roomName
    entrar()
  }
})
</script>

<template>
  <div class="container my-4">
    <h1 class="h3 mb-4 text-center">🎨 PaintRooms</h1>

    <!-- LOBBY -->
    <div v-if="!data.dinsSala" class="card shadow-sm mx-auto" style="max-width: 400px;">
      <div class="card-body">
        <label class="form-label w-100">
          Nom
          <input v-model="data.username" type="text" class="form-control" />
        </label>
        <label class="form-label w-100">
          Sala
          <input v-model="data.roomName" type="text" class="form-control" />
        </label>
        <button class="btn btn-primary w-100 mt-2" @click="entrar">Entrar</button>
      </div>
    </div>

    <!-- SALA -->
    <div v-else class="d-flex flex-wrap gap-4 justify-content-center">
      <div>
        <h2 class="h5">Sala: {{ data.roomName }}</h2>

        <div class="pissarra">
          <canvas
            ref="canvas"
            width="800"
            height="500"
            class="bg-white border rounded shadow-sm"
            @pointerdown="comencar"
            @pointermove="moure"
            @pointerup="acabar"
            @pointerleave="acabar"
          ></canvas>

          <!-- CURSORS DELS ALTRES -->
          <div
            v-for="c in data.cursors"
            :key="c.id"
            class="cursor badge"
            :style="{ left: c.x + 'px', top: c.y + 'px', background: c.color }"
          >
            {{ c.username }}
          </div>
        </div>
      </div>

      <div class="card shadow-sm align-self-start" style="width: 220px;">
        <div class="card-body d-flex flex-column gap-2">
          <label class="form-label">
            Color
            <input v-model="data.color" type="color" class="form-control form-control-color w-100" />
          </label>
          <label class="form-label">
            Gruix: {{ data.gruix }}
            <input v-model.number="data.gruix" type="range" min="1" max="20" class="form-range" />
          </label>
          <button class="btn btn-outline-secondary" @click="netejar">Netejar</button>
          <button class="btn btn-outline-danger" @click="desconnectar">Desconnectar</button>

          <h3 class="h6 mt-3 mb-1">Usuaris</h3>
          <ul class="list-group">
            <li
              v-for="(u, index) in data.usuaris"
              :key="index"
              class="list-group-item"
              :style="{ color: u.color }"
            >
              {{ u.username }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pissarra {
  position: relative;
  width: 800px;
  height: 500px;
}
canvas {
  touch-action: none;
}
.cursor {
  position: absolute;
  pointer-events: none;
}
</style>
