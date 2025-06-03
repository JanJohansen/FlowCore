#!/bin/bash

echo "Starting development environment with pnpm monorepo..."
echo ""
echo "This will start each package in separate terminal windows:"
echo "- Backend (Node.js/Express) on port 3000"
echo "- Frontend (Vue/Vite) on port 5173"
echo "- Common package in watch mode"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Function to start a service in a new terminal
start_service() {
    local name=$1
    local command=$2
    
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="$name" -- bash -c "$command; exec bash"
    elif command -v xterm &> /dev/null; then
        xterm -title "$name" -e bash -c "$command; exec bash" &
    elif command -v osascript &> /dev/null; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $command\""
    else
        echo "Starting $name in background..."
        eval "$command" &
    fi
}

echo "Starting Common package (watch mode)..."
start_service "Common Package - Watch Mode" "cd packages/common && pnpm watch"

sleep 2

echo "Starting Backend server..."
start_service "Backend Server - Port 3000" "cd packages/backend && pnpm dev"

sleep 2

echo "Starting Frontend development server..."
start_service "Frontend Dev Server - Port 5173" "cd packages/frontend && pnpm dev"

echo ""
echo "All development servers are starting in separate windows."
echo "Press Ctrl+C to exit this script."

# Keep the script running
wait
