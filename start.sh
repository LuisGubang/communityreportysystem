#!/bin/bash

echo "🚀 Starting Community Reporting System..."
cd "$(dirname "$0")"

# Kill any existing processes on ports 3000 and 5000
killall node 2>/dev/null || true
lsof -i :3000 | grep -i python | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend
(cd backend && npm run dev > /tmp/backend.log 2>&1) &
BACKEND_PID=$!

# Start frontend from the project root
python3 -m http.server 3000 > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 2

echo ""
echo "=============================================="
echo "✅ Backend running (PID: $BACKEND_PID)"
echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo "=============================================="
echo "🌐 Open your browser: http://localhost:3000"
echo ""
echo "📊 To view logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo "=============================================="
