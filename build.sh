#!/bin/bash
# Build React frontend first
echo "📦 Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Install Python backend deps
echo "🐍 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "✅ Build complete!"
