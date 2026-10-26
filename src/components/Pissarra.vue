<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import socket from '../socket'

const props = defineProps(['color', 'gruix'])

const canvas = ref(null)
let ctx = null

// El meu traç
let pintant = false
let ultim = null

// Els cursors dels altres: cursors[id] = { x, y, username, color }
const cursors = reactive({})

// On és el "llapis" de cada altre usuari mentre pinta: llapis[id] = { x, y, color, width }
const llapis = {}

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

// Esborra tot i pinta la llista de traços que envia el servidor
function repintar(tracos) {
  ctx.clearRect(0, 0, 800, 500)
  for (const t of tracos) {
    let anterior = t.punts[0]
    for (const punt of t.punts) {
      linia(anterior, punt, t.color, t.width)
      anterior = punt
    }
  }
}

// Ratolí / dit sobre el canvas
function comencar(e) {
  pintant = true
  ultim = { x: e.offsetX, y: e.offsetY }
  linia(ultim, ultim, props.color, props.gruix)
  socket.emit('draw_begin', { x: ultim.x, y: ultim.y, color: props.color, width: props.gruix })
}

function moure(e) {
  const punt = { x: e.offsetX, y: e.offsetY }
  socket.emit('cursor_move', punt)

  if (!pintant) return
  linia(ultim, punt, props.color, props.gruix)
  ultim = punt
  socket.emit('draw_move', punt)
}

function acabar() {
  if (!pintant) return
  pintant = false
  socket.emit('draw_end')
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')

  socket.on('repintar', repintar)

  socket.on('cursor_move', (c) => {
    cursors[c.id] = c
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

  socket.on('draw_end', (id) => {
    delete llapis[id]
  })

  socket.on('user_left', (id) => {
    delete cursors[id]
    delete llapis[id]
  })
})

// En sortir de la sala deixem d'escoltar (si no, s'acumularien)
onUnmounted(() => {
  socket.off('repintar')
  socket.off('cursor_move')
  socket.off('draw_begin')
  socket.off('draw_move')
  socket.off('draw_end')
  socket.off('user_left')
})
</script>

<template>
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

    <div
      v-for="c in cursors"
      :key="c.id"
      class="cursor badge"
      :style="{ left: c.x + 'px', top: c.y + 'px', background: c.color }"
    >
      {{ c.username }}
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
