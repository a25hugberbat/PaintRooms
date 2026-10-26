import { io } from 'socket.io-client'

// Una sola connexió per a tota l'app. Els components la importen d'aquí.
const socket = io('http://localhost:3000')

export default socket
