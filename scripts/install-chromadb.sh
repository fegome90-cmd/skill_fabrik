#!/bin/bash
# Install ChromaDB Python dependencies
# Note: ChromaDB 0.3.23 has compatibility issues with Pydantic 2.x
# This script provides two installation methods

echo "📦 Installing ChromaDB Python dependencies..."
echo ""
echo "⚠️  Compatibility Note:"
echo "   ChromaDB 0.3.23 may have issues with Pydantic 2.x"
echo "   Recommendation: Use virtual environment method (Option 1)"
echo ""

# Option 1: Virtual Environment (Recommended for ChromaDB compatibility)
if [ "$1" = "--venv" ] || [ "$1" = "-v" ]; then
  echo "🔧 Using virtual environment method..."
  VENV_DIR="${2:-chromadb-env}"
  
  if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
  fi
  
  source "$VENV_DIR/bin/activate"
  
  echo "📥 Installing ChromaDB with Pydantic 1.x (compatible version)..."
  pip install 'pydantic<2.0' 'pydantic-core<2.0' chromadb python-dotenv
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ChromaDB installed in virtual environment: $VENV_DIR"
    echo ""
    echo "💡 To use this environment, update chroma-wrapper.mjs:"
    echo "   Change python3 to: $VENV_DIR/bin/python3"
    echo ""
    echo "💡 Or activate the environment:"
    echo "   source $VENV_DIR/bin/activate"
    echo "   python3 scripts/chromadb/python-bridge.py heartbeat"
  else
    echo "❌ Installation in virtual environment failed"
    exit 1
  fi
  
  deactivate
  exit 0
fi

# Option 2: System-wide installation (with Pydantic 2.x compatibility patches)
echo "🔧 Using system-wide installation..."
echo "⚠️  Note: Homebrew Python requires --break-system-packages flag"
echo ""

python3 -m pip install chromadb python-dotenv pydantic-settings --break-system-packages

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ ChromaDB dependencies installed successfully"
  echo ""
  echo "⚠️  Note: If you encounter Pydantic validation errors, use:"
  echo "   $0 --venv"
  echo ""
  
  # Verify installation
  python3 scripts/chromadb/python-bridge.py heartbeat 2>&1 | grep -q "success.*true"
  if [ $? -eq 0 ]; then
    echo "✅ Installation verified - ChromaDB is ready!"
  else
    echo "⚠️  Installation completed but verification failed"
    echo "💡 Try using virtual environment method: $0 --venv"
  fi
else
  echo ""
  echo "❌ Installation with --break-system-packages failed"
  echo "💡 Try using virtual environment method:"
  echo "   $0 --venv"
  exit 1
fi
