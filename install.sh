#!/bin/bash
# BeMadRalphy Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/hxp-pxh/BeMadRalphy/main/install.sh | bash

set -e

VERSION="${BEMADRALPHY_VERSION:-latest}"
INSTALL_DIR="${BEMADRALPHY_INSTALL_DIR:-$HOME/.local/bin}"
PACKAGE="bemadralphy@$VERSION"

echo "🚀 Installing BeMadRalphy..."

# Detect package manager
if command -v npm &> /dev/null; then
    echo "Using npm..."
    npm install -g "$PACKAGE"
elif command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm add -g "$PACKAGE"
elif command -v bun &> /dev/null; then
    echo "Using bun..."
    bun add -g "$PACKAGE"
elif command -v yarn &> /dev/null; then
    echo "Using yarn..."
    yarn global add "$PACKAGE"
else
    echo "❌ No package manager found (npm, pnpm, bun, or yarn required)"
    exit 1
fi

if ! command -v bemadralphy &> /dev/null; then
    echo "⚠️  bemadralphy command is not on PATH yet. Attempting to create a local shim..."
    CLI_PATH=""
    if command -v npm &> /dev/null; then
        NPM_ROOT="$(npm root -g 2>/dev/null || true)"
        if [ -n "$NPM_ROOT" ] && [ -f "$NPM_ROOT/bemadralphy/dist/cli.js" ]; then
            CLI_PATH="$NPM_ROOT/bemadralphy/dist/cli.js"
        fi
    fi
    if [ -n "$CLI_PATH" ]; then
        mkdir -p "$INSTALL_DIR"
        cat > "$INSTALL_DIR/bemadralphy" <<EOF
#!/bin/bash
exec node "$CLI_PATH" "\$@"
EOF
        chmod +x "$INSTALL_DIR/bemadralphy"
        if ! command -v bemadralphy &> /dev/null && [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
            echo "ℹ️  Add this to your shell profile:"
            echo "   export PATH=\"$INSTALL_DIR:\$PATH\""
        fi
    fi
fi

echo ""
echo "✅ BeMadRalphy installed successfully."
if command -v bemadralphy &> /dev/null; then
    echo "Version: $(bemadralphy --version)"
else
    echo "⚠️  Command not found on PATH. Use one of the following:"
    echo "  npx bemadralphy --help"
    echo "  $INSTALL_DIR/bemadralphy --help"
fi
echo ""
echo "Get started:"
echo "  bemadralphy --help"
echo "  bemadralphy init"
echo ""
