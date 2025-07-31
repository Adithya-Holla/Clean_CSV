#!/usr/bin/env bash
# CSV Data Cleaner API Startup Script for Render
set -e

echo "Starting CSV Data Cleaner API..."

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p temp_files

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Print environment info
echo "Python version: $(python --version)"
echo "Environment: ${ENVIRONMENT:-production}"
echo "Port: ${PORT:-8001}"

# Start the application
echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001} --workers 1
