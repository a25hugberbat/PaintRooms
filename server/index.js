const { createServer } = require('node:http');
const { Server } = require('socket.io');

const server = createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

// sales['Prova'] = { usuaris: { socketId: { username, color } }, tracos: [ { autor, color, width, punts: [ {x, y} ] } ] }
const sales = {};

// Màxim de traços guardats per sala
const MAX_TRACOS = 500;

// Llista d'usuaris d'una sala en format [{ username, color }]
function llistaUsuaris(roomName) {
  return Object.values(sales[roomName].usuaris);
}

// Treure un socket de la seva sala (per "Sortir" i per desconnexió)
function sortirDeSala(socket) {
  const roomName = socket.data.roomName;
  if (!roomName) return;

  delete sales[roomName].usuaris[socket.id];
  socket.leave(roomName);
  socket.data.roomName = null;

  io.to(roomName).emit('room_users', llistaUsuaris(roomName));
  io.to(roomName).emit('user_left', socket.id);
}

io.on('connection', (socket) => {

  console.log('a user connected');

  // 1. Entrar a una sala (si no existeix, es crea)
  socket.on('join_room', ({ roomName, username }) => {
    sortirDeSala(socket); // per si ja era en una altra

    if (!sales[roomName]) {
      sales[roomName] = { usuaris: {}, tracos: [] };
    }

    socket.join(roomName);
    socket.data.roomName = roomName;
    socket.data.username = username;
    socket.data.color = 'hsl(' + Math.floor(Math.random() * 360) + ', 70%, 50%)';
    socket.data.tracActual = null;

    sales[roomName].usuaris[socket.id] = { username: username, color: socket.data.color };

    // Només a qui entra: el dibuix que ja hi ha a la sala
    socket.emit('repintar', sales[roomName].tracos);

    // A tota la sala: la nova llista d'usuaris
    io.to(roomName).emit('room_users', llistaUsuaris(roomName));
  });

  // 2. Sortir de la sala
  socket.on('leave_room', () => {
    sortirDeSala(socket);
  });

  // 3. Cursor: a la resta de la sala
  socket.on('cursor_move', ({ x, y }) => {
    const roomName = socket.data.roomName;
    if (!roomName) return;

    socket.to(roomName).emit('cursor_move', {
      id: socket.id,
      x: x,
      y: y,
      username: socket.data.username,
      color: socket.data.color
    });
  });

  // 4. Traços
  socket.on('draw_begin', ({ x, y, color, width }) => {
    const roomName = socket.data.roomName;
    if (!roomName) return;

    socket.data.tracActual = { autor: socket.data.username, color: color, width: width, punts: [{ x, y }] };
    socket.to(roomName).emit('draw_begin', { id: socket.id, x, y, color, width });
  });

  socket.on('draw_move', ({ x, y }) => {
    const roomName = socket.data.roomName;
    if (!roomName || !socket.data.tracActual) return;

    socket.data.tracActual.punts.push({ x, y });
    socket.to(roomName).emit('draw_move', { id: socket.id, x, y });
  });

  socket.on('draw_end', () => {
    const roomName = socket.data.roomName;
    if (!roomName || !socket.data.tracActual) return;

    sales[roomName].tracos.push(socket.data.tracActual);
    if (sales[roomName].tracos.length > MAX_TRACOS) {
      sales[roomName].tracos.shift();
    }
    socket.data.tracActual = null;

    socket.to(roomName).emit('draw_end', socket.id);
  });

  // 5. Netejar només els traços de qui prem el botó
  socket.on('clear_canvas', () => {
    const roomName = socket.data.roomName;
    if (!roomName) return;

    sales[roomName].tracos = sales[roomName].tracos.filter((t) => t.autor !== socket.data.username);

    // Tothom torna a pintar el que queda
    io.to(roomName).emit('repintar', sales[roomName].tracos);
  });

  // 6. Desconnexió (tancar pestanya, refrescar...)
  socket.on('disconnect', () => {
    sortirDeSala(socket);
  });

});

server.listen(3000, () => {
  console.log('http://localhost:3000');
});
