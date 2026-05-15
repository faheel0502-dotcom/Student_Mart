const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Only proxy /api and /socket.io routes to the backend
  app.use(
    ['/api', '/socket.io'],
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      ws: true, // proxy websockets for Socket.IO
    })
  );
};
