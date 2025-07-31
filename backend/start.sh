#!/usr/bin/env bash
# Backend deployment script for Render

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port $PORT
