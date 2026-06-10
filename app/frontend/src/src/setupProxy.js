// CRA dev-server proxy (dev only — never part of the production build).
//
// Forwards API calls to the local Flask server so the frontend can use
// relative URLs (/ati/data-api/v1, /ati/auth/v1). Same-origin requests mean
// the SameSite=Lax session cookie just works in dev.
//
// This replaces the package.json "proxy" field, which trips a react-scripts
// 5.0.1 bug ("options.allowedHosts[0] should be a non-empty string") on
// machines where the dev server can't detect a LAN address.
// http-proxy-middleware ships inside react-scripts — not a direct dependency.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        ['/ati/data-api', '/ati/auth'],
        createProxyMiddleware({
            target: 'http://127.0.0.1:5000',
            changeOrigin: true,
        })
    );
};
