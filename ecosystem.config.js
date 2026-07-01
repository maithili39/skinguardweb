// PM2 process config for self-hosted deployments.
// Usage:
//   npm run build && pm2 start ecosystem.config.js
//   pm2 save && pm2 startup   # auto-restart on server reboot
//
// On Vercel/Railway/Render this file is not needed — the platform handles restarts.

module.exports = {
  apps: [
    {
      name: "skinguard",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      autorestart: true,       // restart on crash automatically
      max_restarts: 10,        // give up after 10 rapid crashes (bad deploy guard)
      min_uptime: "10s",       // a restart within 10s counts as a crash
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
