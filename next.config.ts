import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  // Allow TradingView iframes and external resources
  // Allow embedding from the Copper Giant Hub
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // ⚠️  X-Frame-Options REMOVED intentionally.
          // We use CSP frame-ancestors instead (more precise control).
          // This allows the Hub at hub.soluciones.coppergiant.co to embed this app.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://s.tradingview.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.twelvedata.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://finance.yahoo.com wss://streamer.finance.yahoo.com",
              "frame-src 'self' https://s.tradingview.com https://www.tradingview.com",
              "media-src 'self'",
              // Allow the Hub to embed this app in an iframe
              "frame-ancestors 'self' https://hub.soluciones.coppergiant.co https://*.easypanel.host",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
