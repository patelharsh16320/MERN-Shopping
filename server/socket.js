const jwt = require('jsonwebtoken');
const User = require('./models/User');
const ChatMessage = require('./models/ChatMessage');

module.exports = (io) => {
  // Authenticate every socket connection via JWT (guests allowed without token)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.userId   = null;
        socket.userRole = 'guest';
        socket.userName = 'Guest';
        return next();
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name role');
      if (!user) return next(new Error('USER_NOT_FOUND'));
      socket.userId   = decoded.id;
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, userRole, userName } = socket;

    // Everyone joins the public room for broadcast events (product updates etc.)
    socket.join('public_room');

    // Users join their own private room; admins join the global admin room
    if (userRole === 'admin') {
      socket.join('admin_room');
    } else if (userRole === 'user' && userId) {
      socket.join(`user_${userId}`);
      // Notify admins that this user is online
      io.to('admin_room').emit('user_online', { userId, userName });
    }

    // Admin joins a specific user's room to read/reply
    socket.on('admin_join_room', (roomUserId) => {
      if (userRole !== 'admin') return;
      socket.join(`user_${roomUserId}`);
    });

    // Admin leaves a specific user's room
    socket.on('admin_leave_room', (roomUserId) => {
      if (userRole !== 'admin') return;
      socket.leave(`user_${roomUserId}`);
    });

    // Send a message
    socket.on('send_message', async ({ roomUserId, message }) => {
      if (!message?.trim()) return;
      // Determine room: user sends to own room, admin sends to target user room
      const room = roomUserId || userId;
      try {
        const msg = await ChatMessage.create({
          room,
          sender:     userId,
          senderRole: userRole,
          senderName: userName,
          message:    message.trim(),
        });
        const payload = {
          _id:        msg._id,
          room:       msg.room,
          sender:     msg.sender,
          senderRole: msg.senderRole,
          senderName: msg.senderName,
          message:    msg.message,
          createdAt:  msg.createdAt,
          read:       msg.read,
        };
        // Deliver to both the user room and admin room
        io.to(`user_${room}`).emit('new_message', payload);
        io.to('admin_room').emit('new_message', payload);
        // Notify admin of new message (for badge / toast)
        if (userRole === 'user') {
          io.to('admin_room').emit('chat_notification', { roomUserId: room, userName, message: message.trim() });
        }
      } catch (err) {
        socket.emit('error', { message: 'Message failed to send' });
      }
    });

    // Typing indicators
    socket.on('typing_start', ({ roomUserId }) => {
      const room = roomUserId || userId;
      socket.to(`user_${room}`).emit('peer_typing', { senderRole: userRole, isTyping: true });
      if (userRole === 'user') socket.to('admin_room').emit('peer_typing', { roomUserId: room, senderRole: userRole, isTyping: true });
    });
    socket.on('typing_stop', ({ roomUserId }) => {
      const room = roomUserId || userId;
      socket.to(`user_${room}`).emit('peer_typing', { senderRole: userRole, isTyping: false });
      if (userRole === 'user') socket.to('admin_room').emit('peer_typing', { roomUserId: room, senderRole: userRole, isTyping: false });
    });

    socket.on('disconnect', () => {
      if (userRole === 'user' && userId) {
        io.to('admin_room').emit('user_offline', { userId, userName });
      }
    });
  });
};
