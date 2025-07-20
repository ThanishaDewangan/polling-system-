import { io } from 'socket.io-client';

// Create a socket instance
const SOCKET_URL = 'http://localhost:5000';
const socket = io(SOCKET_URL);

// Export the socket instance
export default socket;