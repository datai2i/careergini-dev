#!/bin/bash
set -e

echo "🤖 Downloading Ollama models for CareerGini..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama is not running. Starting Ollama service..."
    sudo docker compose up -d ollama
    echo "⏳ Waiting for Ollama to be ready..."
    sleep 15
fi

echo "📥 Downloading Qwen2.5 7B Instruct (Q4_K_M) - Complex reasoning..."
sudo docker compose exec ollama ollama pull qwen2.5:7b-instruct-q4_K_M || ollama pull qwen2.5:7b-instruct-q4_K_M

echo "📥 Downloading Phi3 Mini 3.8B (Q4_K_M) - Fast tasks..."
sudo docker compose exec ollama ollama pull phi3:mini || ollama pull phi3:mini

echo "📥 Downloading Qwen2.5-Coder 7B (Q4_K_M) - Technical analysis..."
sudo docker compose exec ollama ollama pull qwen2.5-coder:7b-instruct-q4_K_M || ollama pull qwen2.5-coder:7b-instruct-q4_K_M

echo "✅ All models downloaded successfully!"
echo ""
echo "📊 Available models:"
sudo docker compose exec ollama ollama list || ollama list

echo ""
echo "💾 Total storage used: ~12 GB"
echo "🎯 Models ready for inference!"
