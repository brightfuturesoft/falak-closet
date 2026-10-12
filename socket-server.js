const http = require('http');
const { Server } = require('socket.io');

// Railway/Render/Fly inject PORT; keep SOCKET_PORT as an explicit override.
const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;

const server = http.createServer((req, res) => {
  // CORS headers for HTTP requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'Falak Closet Socket Server' }));
    return;
  }

  // HTTP broadcast endpoint for server-side Next.js route handlers
  if (req.url === '/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { event, data } = payload;
        if (event) {
          io.to('admin_room').emit(event, data);
          io.emit(event, data);
          console.log(`[Socket Server] HTTP Broadcasted event: ${event}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }
      } catch (e) {
        console.error('[Socket Server] Broadcast parse error:', e.message);
      }
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid broadcast payload' }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
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
    io.to('admin_room').emit('new_order_alert', orderData);
    io.emit('new_order_alert', orderData);
  });

  // Order updated (status change, courier dispatch, verification)
  socket.on('order_update', (orderData) => {
    console.log(`[Socket Server] Order updated: #${orderData?.id || orderData?.orderId || 'Unknown'}`);
    io.to('admin_room').emit('order_updated', orderData);
    io.emit('order_updated', orderData);
  });

  // Product updated / created / deleted / stock changed
  socket.on('product_update', (productData) => {
    console.log(`[Socket Server] Product sync event: ${productData?.type || 'update'}`);
    io.to('admin_room').emit('product_sync', productData);
    io.emit('product_sync', productData);
  });

  // Promotion / Voucher updated
  socket.on('promotion_update', (promoData) => {
    console.log(`[Socket Server] Promotion sync event`);
    io.to('admin_room').emit('promotion_sync', promoData);
    io.emit('promotion_sync', promoData);
  });

  // Category updated
  socket.on('category_update', (categoryData) => {
    console.log(`[Socket Server] Category sync event`);
    io.to('admin_room').emit('category_sync', categoryData);
    io.emit('category_sync', categoryData);
  });

  // Store Settings updated
  socket.on('settings_update', (settingsData) => {
    console.log(`[Socket Server] Settings sync event`);
    io.to('admin_room').emit('settings_sync', settingsData);
    io.emit('settings_sync', settingsData);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Server] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Falak Closet] Socket.io Real-Time Alert Server running on port ${PORT}`);
});
