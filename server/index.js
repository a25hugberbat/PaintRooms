import { Server } from 'socket.io'

const io = new Server(3000, {
  cors: { origin: 'http://localhost:5173/' }   // TODO: más adelante, pon aquí la URL de tu Vue
})

io.on('connection', (socket) => {
  console.log('Alguien se ha conectado:', socket.id)

  socket.on('disconnect', () => {
    console.log('Se ha ido:', socket.id)
  })
})