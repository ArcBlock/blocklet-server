#!/bin/bash
# ========================================================================
# Blocklet Server Development Environment Startup Script
# This script creates multiple tmux windows to run various Blocklet Server components
# ========================================================================

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get project root directory path
export PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rm -rf $PROJECT_PATH/core/webapp/.env.development.local || true
rm -rf $PROJECT_PATH/core/webapp/.env.e2e || true

echo -e "${BLUE}=== Blocklet Server Development Environment Startup ===${NC}"
echo -e "${YELLOW}Project Path: ${PROJECT_PATH}${NC}\n"

# ==========================================================
# Environment Setup
# ==========================================================

# Fix ulimit for nginx worker_connections (prevents NaN error)
# macOS may have ulimit set to 'unlimited' which causes issues
current_ulimit=$(ulimit -n)
if [ "$current_ulimit" = "unlimited" ] || [ "$current_ulimit" -lt 10240 ] 2>/dev/null; then
  ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true
  echo -e "${GREEN}Set ulimit -n to $(ulimit -n)${NC}"
fi

# Load environment variables
if [ -f "$PROJECT_PATH/.env.development" ]; then
  echo -e "${GREEN}Loading environment config: .env.development${NC}"
  source $PROJECT_PATH/.env.development
fi

# Check and stop nginx
if pgrep -x "nginx" >/dev/null; then
  echo -e "${YELLOW}Nginx detected, stopping...${NC}"
  # Try to stop nginx normally
  nginx -s stop 2>/dev/null || sudo nginx -s stop 2>/dev/null

  # Ensure nginx is completely stopped
  if pgrep -x "nginx" >/dev/null; then
    echo -e "${RED}Attempting to force stop Nginx...${NC}"
    sudo pkill -9 nginx 2>/dev/null || pkill -9 nginx 2>/dev/null
  fi

  echo -e "${GREEN}Nginx stopped${NC}"
fi

# Check and close existing tmux session
tmux has-session -t blocklet 2>/dev/null

# ==========================================================
# Create tmux session
# ==========================================================

echo -e "${GREEN}Creating tmux session: blocklet${NC}"
tmux new-session -d -s blocklet

# User prompt
if [ -z "$TMUX" ]; then
  echo -e "${YELLOW}Waiting for startup, press C-b + w to view all windows${NC}"
fi

# ==========================================================
# Start service windows
# ==========================================================

# Window 1: Database and Message Queue
echo -e "${GREEN}[1/7] Starting Hub (Database and Message Queue)...${NC}"
tmux send-keys -t blocklet:0 "cd $PROJECT_PATH/core/webapp && npm run start:hub" C-m
tmux rename-window -t blocklet:0 'hub'
sleep 2

# Window 2: UX Component Library
echo -e "${GREEN}[2/7] Starting UX Component Library...${NC}"
tmux new-window -t blocklet:1 -n 'ux'
tmux send-keys -t blocklet:1 "cd $PROJECT_PATH/core/ux && npm run build && npm run watch" C-m

# Window 3: Server Daemon
echo -e "${GREEN}[3/7] Starting Server Daemon...${NC}"
tmux new-window -t blocklet:2 -n 'webapp'
tmux send-keys -t blocklet:2 "cd $PROJECT_PATH/core/webapp && npm run start:daemon $YARN_START_GREP" C-m
sleep 2

# Window 4: Blocklet Service
echo -e "${GREEN}[4/7] Starting Blocklet Service...${NC}"
tmux new-window -t blocklet:3 -n 'service'
tmux send-keys -t blocklet:3 "cd $PROJECT_PATH/core/webapp && npm run start:service $YARN_START_GREP" C-m
sleep 2

# Window 5: Blocklet Service Client
echo -e "${GREEN}[5/7] Starting Blocklet Service Client...${NC}"
tmux new-window -t blocklet:4 -n 'service-client'
tmux send-keys -t blocklet:4 "cd $PROJECT_PATH/core/blocklet-services && npm run start:client" C-m

# Window 6: Server Dashboard
echo -e "${GREEN}[6/7] Starting Server Dashboard...${NC}"
tmux new-window -t blocklet:5 -n 'webapp-client'
tmux send-keys -t blocklet:5 "cd $PROJECT_PATH/core/webapp && npm run start:client" C-m

# Window 7: @blocklet/sdk watch
if [ -z "${SKIP_WATCH_SDK}" ]; then
  echo -e "${GREEN}[7/7] Starting @blocklet/sdk watch...${NC}"
  tmux new-window -t blocklet:6 -n 'sdk-watch'
  tmux send-keys -t blocklet:6 "cd \"$PROJECT_PATH\"/blocklet/node-sdk && npm run build:watch" C-m
else
  echo -e "${YELLOW}SKIP_WATCH_SDK set, skipping @blocklet/sdk watch (window 7)${NC}"
fi

# ==========================================================
# Attach or switch to tmux session
# ==========================================================

echo -e "${BLUE}\n=== All services started ===${NC}"

if [ -z "$TMUX" ]; then
  # If not in tmux, attach to session
  echo -e "${GREEN}Connecting to tmux session...${NC}"
  tmux select-window -t blocklet:2
  tmux attach-session -t blocklet
else
  # If already in tmux, switch to specified window
  tmux select-window -t blocklet:2
  echo -e "${YELLOW}All services running in tmux, press C-b + w to view all windows${NC}"
fi
