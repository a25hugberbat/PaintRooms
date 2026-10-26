# PaintRooms

Pissarra col·laborativa per sales amb Vue 3 + Socket.IO.

## Arrencar

Servidor:

```sh
cd server
npm install
node index.js
```

Client (en una altra terminal):

```sh
npm install
npm run dev
```

## Estructura

```
server/index.js            servidor Socket.IO (sales, usuaris, traços)
src/main.js                crea l'app i hi posa el router
src/socket.js              la connexió amb el servidor (una per a tota l'app)
src/router/index.js        rutes: /  i  /sala/:sala/:nom
src/App.vue                títol + <RouterView />
src/views/LobbyView.vue    formulari nom + sala
src/views/SalaView.vue     entra/surt de la sala i ajunta els components
src/components/Pissarra.vue       canvas, traços i cursors
src/components/Eines.vue          color, gruix, Netejar, Sortir
src/components/LlistaUsuaris.vue  usuaris de la sala
```
