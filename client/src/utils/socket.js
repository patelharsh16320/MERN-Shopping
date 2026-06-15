import { io } from 'socket.io-client';

let socket     = null;  // authenticated
let pubSocket  = null;  // unauthenticated (guest, for public_room events)

export const initSocket = (token) => {
  if (socket?.connected) return socket;
  if (socket) socket.disconnect();
  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
  return socket;
};

// Used by pages that don't require auth (e.g. Products page) to receive broadcast events
export const initPublicSocket = () => {
  if (pubSocket?.connected) return pubSocket;
  if (pubSocket) pubSocket.disconnect();
  pubSocket = io('http://localhost:5000', {
    auth: {},   // no token → server treats as guest → joins public_room
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });
  return pubSocket;
};

export const getSocket    = () => socket;
export const getPubSocket = () => pubSocket;

export const disconnectSocket = () => {
  if (socket)    { socket.disconnect();    socket    = null; }
  if (pubSocket) { pubSocket.disconnect(); pubSocket = null; }
};
