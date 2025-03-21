const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
  app.use(
    '/mgbank',
    createProxyMiddleware({
      target: 'http://[::1]:9202',
      changeOrigin: true,
      secure: false
    })
  );
}