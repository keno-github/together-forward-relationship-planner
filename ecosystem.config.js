/**
 * PM2 Ecosystem Configuration
 *
 * Manages the TogetherForward backend server with:
 * - Auto-restart on crashes
 * - Log management and rotation
 * - Environment-specific configurations
 * - Process monitoring
 *
 * Usage:
 *   npm run pm2:start    - Start backend with PM2
 *   npm run pm2:stop     - Stop backend
 *   npm run pm2:logs     - View logs in real-time
 *   npm run pm2:restart  - Restart backend
 *   npm run pm2:status   - Check status
 */

module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'together-forward-backend',
      script: './server.js',

      // Working Directory
      cwd: './',

      // Execution Mode
      instances: 1, // Single instance (change to 'max' for cluster mode)
      exec_mode: 'fork', // 'fork' or 'cluster'

      // Auto-restart Configuration
      watch: false, // Set to true in development to auto-restart on file changes
      watch_delay: 1000, // Delay between file change and restart (ms)
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        'src',
        'public'
      ],

      // Restart Policies
      max_restarts: 10, // Max restarts within 1 minute before stopping
      min_uptime: '10s', // Minimum uptime to be considered successful
      max_memory_restart: '500M', // Restart if memory exceeds 500MB

      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },

      // Logging Configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      combine_logs: true, // Combine stdout and stderr into one file
      merge_logs: true, // Merge logs from multiple instances

      // Log Rotation (requires pm2-logrotate module)
      // Install: pm2 install pm2-logrotate
      // Configure: pm2 set pm2-logrotate:max_size 10M

      // Process Management
      kill_timeout: 5000, // Time to wait before force killing (ms)
      wait_ready: false, // Wait for process.send('ready')
      listen_timeout: 3000, // Time to wait for listen event (ms)

      // Advanced Options
      autorestart: true, // Auto-restart on crash
      cron_restart: '', // Cron pattern for scheduled restarts (e.g., '0 0 * * *' for daily)

      // Source Map Support (for better error traces)
      source_map_support: true,

      // Interpreter
      interpreter: 'node',
      interpreter_args: '', // Node.js flags (e.g., '--max-old-space-size=4096')

      // Time zone
      time: true
    }
  ],

  // Deployment Configuration (optional - for production)
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/together-forward.git',
      path: '/var/www/together-forward',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': ''
    }
  }
};
