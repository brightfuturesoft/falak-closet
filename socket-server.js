const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.SOCKET_PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Falak Closet Socket Server' }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket Server] Client connected: ${socket.id}`);

  // Admin client joins admin room
  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`[Socket Server] Client ${socket.id} joined admin_room`);
  });

  // Client emits new order purchase event
  socket.on('new_order', (orderData) => {
    console.log(`[Socket Server] New order received: #${orderData?.id || 'Unknown'}`);
    // Broadcast to all connected admin clients & all listeners
    io.to('admin_room').emit('new_order_alert', orderData);
    io.emit('new_order_alert', orderData);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Server] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Falak Closet] Socket.io Real-Time Alert Server running on port ${PORT}`);
});
