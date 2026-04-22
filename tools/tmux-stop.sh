#!/bin/bash

#===============================================================================
# Blocklet Server Cleanup Script
# This script ensures all related processes are properly terminated
# when closing tmux sessions
#===============================================================================

export PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🧹 Cleaning up Blocklet Server processes..."

#---------------------------------------
# 1. Cleanup tmux session
#---------------------------------------
if tmux has-session -t blocklet 2>/dev/null; then
  echo "🚫 Terminating tmux session: blocklet"
  tmux kill-session -t blocklet
fi

#---------------------------------------
# 2. Cleanup Node.js processes
#---------------------------------------
echo "🔄 Terminating Node.js processes..."
pkill -f "npm run start:hub" || true
pkill -f "npm run start:daemon" || true
pkill -f "npm run start:service" || true
pkill -f "npm run start:client" || true
pkill -f "npm run watch" || true
pkill -f "node.*webpack" || true
pkill -f "node.*dev/daemon.js" || true

#---------------------------------------
# 3. Run deep cleanup
#---------------------------------------
echo "🧼 Executing deep cleanup..."
PM2_HOME=~/.arcblock/abtnode-dev pm2 stop all

#---------------------------------------
# 4. Cleanup Nginx processes
#---------------------------------------
echo "🔄 Checking and terminating Nginx processes..."
if pgrep nginx >/dev/null; then
  echo "🚫 Terminating Nginx processes"
  killall nginx 2>/dev/null || true

  # Try force kill if normal termination fails
  if pgrep nginx >/dev/null; then
    echo "🔥 Force terminating Nginx processes"
    killall -9 nginx 2>/dev/null || true
  fi
fi

#---------------------------------------
# 5. Cleanup processes on specific ports
#---------------------------------------
echo "🔍 Terminating processes on specific ports..."
for port in 3030 8080 8089 9090 40406; do
  pid=$(lsof -i:$port -t 2>/dev/null)
  if [ ! -z "$pid" ]; then
    if ps -p $pid -f | grep node | grep -qi service || ps -p $pid -f | grep -q "dev/daemon.js"; then
      echo "🚫 Terminating node service/daemon process on port $port: $pid"
      kill -9 $pid 2>/dev/null || true
    else
      echo "⏭️ Skipping non-service process on port $port: $pid"
    fi
  fi
done

#---------------------------------------
# 6. Cleanup nodemon processes
#---------------------------------------
echo "🔄 Terminating nodemon processes..."
pkill -f "nodemon" || true
echo "✅ Cleanup complete! All Blocklet Server processes have been terminated."

# Exit with success status code
exit 0
