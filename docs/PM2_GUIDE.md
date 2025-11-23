# PM2 Process Management Guide

PM2 manages the TogetherForward backend with automatic restarts, logging, and monitoring.

## Quick Start

### Start Backend with PM2
```bash
npm run pm2:start
```

### Start Frontend + Backend Together (with PM2)
```bash
npm run dev:pm2
```

---

## Common Commands

### 📊 View Logs (Real-time)
```bash
npm run pm2:logs
```
**This is what Claude Code can read to debug issues!**

### 🔍 View Only Errors
```bash
npm run pm2:logs:error
```

### 📈 Monitor Process (CPU, Memory)
```bash
npm run pm2:monit
```

### ✅ Check Status
```bash
npm run pm2:status
```

### 🔄 Restart Backend
```bash
npm run pm2:restart
```

### 🛑 Stop Backend
```bash
npm run pm2:stop
```

### ❌ Delete Process (Stop + Remove)
```bash
npm run pm2:delete
```

---

## Auto-Restart on File Changes (Development)

Start backend in watch mode (auto-restart when server.js changes):
```bash
npm run pm2:start:watch
```

---

## Reading Logs

### Option 1: Real-time in Terminal
```bash
npm run pm2:logs
```
Press `Ctrl+C` to exit

### Option 2: Read Log Files Directly
```bash
# All logs (combined)
cat logs/backend-out.log

# Only errors
cat logs/backend-error.log

# Last 50 lines
tail -n 50 logs/backend-out.log

# Follow logs in real-time
tail -f logs/backend-out.log
```

### Option 3: Search Logs
```bash
# Search for specific errors
grep "ERROR" logs/backend-error.log

# Search for API calls
grep "Claude API" logs/backend-out.log

# Search with context (show 3 lines before and after match)
grep -C 3 "error" logs/backend-out.log
```

---

## Log Format

Logs include timestamps and structured information:

```
2025-11-14 15:30:45 +00:00: ============================================================
2025-11-14 15:30:45 +00:00: 🚀 Luna backend running on http://localhost:3001
2025-11-14 15:30:45 +00:00: ============================================================
2025-11-14 15:30:45 +00:00: 🔧 Server Configuration:
2025-11-14 15:30:45 +00:00:   - Environment: development
2025-11-14 15:30:45 +00:00:   - Port: 3001
2025-11-14 15:30:45 +00:00:   - Claude Model: claude-haiku-4-5-20251001
2025-11-14 15:30:45 +00:00:   - Claude API Key: sk-ant-...CCJQ
```

---

## Debugging with PM2 Logs

### When Backend Crashes
1. Check status:
   ```bash
   npm run pm2:status
   ```

2. View recent error logs:
   ```bash
   npm run pm2:logs:error
   ```

3. PM2 will auto-restart the backend (up to 10 times in 1 minute)

### When API Calls Fail
1. Watch logs in real-time:
   ```bash
   npm run pm2:logs
   ```

2. Look for error messages from Claude API:
   ```
   ❌ Claude API error: { error: { type: 'invalid_request', message: '...' } }
   ```

3. Share the error with Claude Code for debugging

### Memory Leaks
If backend keeps restarting, check memory usage:
```bash
npm run pm2:monit
```

Backend auto-restarts if memory exceeds 500MB (configured in `ecosystem.config.js`)

---

## Advanced PM2 Commands

### Flush Logs (Clear old logs)
```bash
pm2 flush
```

### Restart All PM2 Processes
```bash
pm2 restart all
```

### Save PM2 Process List (Auto-start on reboot)
```bash
pm2 save
pm2 startup
```

### View More Details
```bash
pm2 describe together-forward-backend
```

---

## Log Rotation (Recommended for Production)

Install log rotation module:
```bash
pm2 install pm2-logrotate
```

Configure rotation:
```bash
# Max log file size before rotation (default 10MB)
pm2 set pm2-logrotate:max_size 10M

# Number of rotated logs to keep (default 10)
pm2 set pm2-logrotate:retain 30

# Compress rotated logs
pm2 set pm2-logrotate:compress true

# Rotation interval (daily at midnight)
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```

---

## Configuration (`ecosystem.config.js`)

### Key Settings

```javascript
{
  name: 'together-forward-backend',
  script: './server.js',
  instances: 1,                    // Number of instances (1 for dev)
  max_restarts: 10,                // Max restarts before giving up
  max_memory_restart: '500M',      // Restart if memory exceeds 500MB
  error_file: './logs/backend-error.log',
  out_file: './logs/backend-out.log',
  autorestart: true,               // Auto-restart on crash
  watch: false                     // Set to true to auto-restart on file changes
}
```

### Enable Watch Mode in Config

Edit `ecosystem.config.js`:
```javascript
watch: true,
ignore_watch: ['node_modules', 'logs', '.git', 'src', 'public']
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check PM2 status
npm run pm2:status

# View error logs
npm run pm2:logs:error

# Delete and restart
npm run pm2:delete
npm run pm2:start
```

### Logs Not Updating
```bash
# Flush logs
pm2 flush

# Restart PM2 daemon
pm2 kill
npm run pm2:start
```

### Can't Find Process
```bash
# List all PM2 processes
pm2 list

# If empty, start backend
npm run pm2:start
```

---

## For Claude Code Debugging

When you encounter an error:

1. **Run this command and share output:**
   ```bash
   npm run pm2:logs
   ```

2. **Or read log files directly:**
   ```bash
   cat logs/backend-error.log
   cat logs/backend-out.log
   ```

3. **Claude Code can then:**
   - Analyze the error
   - Identify the root cause
   - Suggest fixes
   - Monitor logs after fix is applied

---

## Production Deployment

For production, use cluster mode:

Edit `ecosystem.config.js`:
```javascript
instances: 'max',        // Use all CPU cores
exec_mode: 'cluster',    // Cluster mode
```

Start in production:
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PM2 Log Management](https://pm2.keymetrics.io/docs/usage/log-management/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
