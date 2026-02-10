#!/bin/bash
# BeMadRalphy Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/hxp-pxh/BeMadRalphy/main/install.sh | bash

set -e

VERSION="${BEMADRALPHY_VERSION:-latest}"
INSTALL_DIR="${BEMADRALPHY_INSTALL_DIR:-$HOME/.local/bin}"

echo "🚀 Installing BeMadRalphy..."

# Detect package manager
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun add -g bemadralphy@$VERSION
elif command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm add -g bemadralphy@$VERSION
elif command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install -g bemadralphy@$VERSION
elif command -v yarn &> /dev/null; then
    echo "Using yarn..."
    yarn global add bemadralphy@$VERSION
else
    echo "❌ No package manager found (npm, pnpm, bun, or yarn required)"
    exit 1
fi

echo ""
echo "✅ BeMadRalphy installed successfully!"
echo ""
echo "Get started:"
echo "  bemadralphy --help"
echo "  bemadralphy init"
echo ""
