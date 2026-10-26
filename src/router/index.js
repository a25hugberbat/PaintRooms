import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/LobbyView.vue'
import SalaView from '../views/SalaView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'lobby', component: LobbyView },
    // La sala i el nom van a la URL: si es refresca la pàgina, tornes a entrar sol
    { path: '/sala/:sala/:nom', name: 'sala', component: SalaView }
  ]
})

export default router
