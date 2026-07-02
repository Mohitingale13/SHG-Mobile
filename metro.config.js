const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

const BACKEND_PORT = process.env.PORT || "5000";

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    const apiProxy = createProxyMiddleware({
      target: `http://localhost:${BACKEND_PORT}`,
      changeOrigin: false,
      on: {
        error: (err, req, res) => {
          console.error("[Metro proxy] Backend not reachable:", err.message);
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Backend server not running on port " + BACKEND_PORT }));
        },
      },
    });

    return (req, res, next) => {
      if (req.url.startsWith("/api")) {
        return apiProxy(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
