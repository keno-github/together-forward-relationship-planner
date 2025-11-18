#!/bin/bash

# Restart Development Environment Script
# This script cleanly kills all Node processes and restarts the dev servers

echo "=================================================="
echo "🔄 Restarting Together Forward Development Servers"
echo "=================================================="
echo ""

# Step 1: Kill all Node.js processes
echo "🛑 Step 1: Killing all Node.js processes..."

# Try multiple methods to ensure all processes are killed
pkill -9 node 2>/dev/null || echo "   No processes found via pkill"
killall -9 node 2>/dev/null || echo "   No processes found via killall"

# Windows-specific (if running in Git Bash/WSL)
taskkill //F //IM node.exe 2>/dev/null || echo "   No Windows node.exe processes found"

# Wait for processes to fully terminate
sleep 2

# Verify no node processes are running
if pgrep -x node > /dev/null; then
    echo "   ⚠️  WARNING: Some node processes may still be running"
    echo "   Please manually close them and run this script again"
    exit 1
else
    echo "   ✅ All Node.js processes terminated"
fi

echo ""

# Step 2: Clear Node module cache (optional but recommended)
echo "📦 Step 2: Clearing Node module cache..."
rm -rf node_modules/.cache 2>/dev/null || echo "   No cache to clear"
echo "   ✅ Cache cleared"

echo ""

# Step 3: Start backend server
echo "🚀 Step 3: Starting backend server (port 3001)..."
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "   ✅ Backend server started successfully (PID: $BACKEND_PID)"
    echo "   📋 Backend logs: tail -f backend.log"
else
    echo "   ❌ Backend server failed to start"
    echo "   Check backend.log for errors"
    exit 1
fi

echo ""

# Step 4: Start frontend server
echo "🎨 Step 4: Starting frontend server (port 3000)..."
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "   ✅ Frontend server started successfully (PID: $FRONTEND_PID)"
    echo "   📋 Frontend logs: tail -f frontend.log"
else
    echo "   ❌ Frontend server failed to start"
    echo "   Check frontend.log for errors"
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Development environment restarted successfully!"
echo "=================================================="
echo ""
echo "📊 Server Status:"
echo "   Backend:  http://localhost:3001 (PID: $BACKEND_PID)"
echo "   Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📋 View logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎯 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Hard refresh (Ctrl+Shift+R) to clear browser cache"
echo "   3. Clear old test data from Supabase"
echo "   4. Start fresh Luna conversation"
echo ""
