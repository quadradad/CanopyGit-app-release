#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Canopy Setup — run after cloning the canopy-app repo
#
# Usage:
#   git clone <repo> canopy-app
#   cd canopy-app
#   ./setup.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colors ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✓${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
fail()    { echo -e "${RED}✗${NC}  $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}▸ $*${NC}"; }

# ── Locate repo root (script's own directory) ─────────────────────
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Welcome ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}🌿 Canopy Setup${NC}"
echo ""

INSTALL_BASE="$HOME/Library/Application Support/Canopy"
INSTALL_APP="$INSTALL_BASE/app"

# ── Detect existing installation ──────────────────────────────────
if [[ -d "$INSTALL_APP" ]]; then
  info "Existing installation detected — updating in place"
  info "Your data (canopy.db) will be preserved"
  echo ""
fi

# ── Find Node.js ──────────────────────────────────────────────────
step "Checking Node.js..."

NODE_BIN=""

# Check common locations (reuses pattern from scripts/create-mac-app.sh)
for candidate in \
  "$HOME/.nvm/versions/node/$(ls -1 "$HOME/.nvm/versions/node/" 2>/dev/null | sort -V | tail -1)/bin/node" \
  "$HOME/.volta/bin/node" \
  "$HOME/.fnm/aliases/default/bin/node" \
  "/opt/homebrew/bin/node" \
  "/usr/local/bin/node" \
  "/usr/bin/node"; do
  if [[ -x "$candidate" ]]; then
    NODE_BIN="$candidate"
    break
  fi
done

# Fallback to PATH
if [[ -z "$NODE_BIN" ]]; then
  NODE_BIN=$(command -v node 2>/dev/null || true)
fi

# If not found, try installing via Homebrew
if [[ -z "$NODE_BIN" ]]; then
  if command -v brew &>/dev/null; then
    step "Node.js not found — installing via Homebrew..."
    brew install node@22
    brew link node@22 --overwrite 2>/dev/null || true
    NODE_BIN=$(brew --prefix node@22)/bin/node
    if [[ ! -x "$NODE_BIN" ]]; then
      NODE_BIN=$(command -v node 2>/dev/null || true)
    fi
  fi
fi

if [[ -z "$NODE_BIN" ]]; then
  fail "Node.js not found.\n\n   Canopy requires Node.js 20 or later.\n\n   Install options:\n     brew install node@22\n     https://nodejs.org\n     https://github.com/nvm-sh/nvm"
fi

# Verify version >= 20
NODE_VERSION=$("$NODE_BIN" --version | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [[ "$NODE_MAJOR" -lt 20 ]]; then
  fail "Node.js $NODE_VERSION is too old.\n\n   Canopy requires Node.js 20 or later.\n   Current: $NODE_VERSION\n\n   Update with:\n     brew install node@22\n     or visit https://nodejs.org"
fi

success "Node.js $NODE_VERSION ($NODE_BIN)"

# ── Find npm (co-located with node) ──────────────────────────────
NPM_BIN="$(dirname "$NODE_BIN")/npm"
if [[ ! -x "$NPM_BIN" ]]; then
  NPM_BIN=$(command -v npm 2>/dev/null || true)
fi
if [[ -z "$NPM_BIN" ]]; then
  fail "npm not found. It should come with Node.js.\n   Try reinstalling Node.js from https://nodejs.org"
fi

# ── Copy source to install location ──────────────────────────────
step "Installing Canopy..."

mkdir -p "$INSTALL_APP"

info "Copying source files..."
rsync -a --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  "$REPO_DIR/" "$INSTALL_APP/"
success "Source files copied"

# ── Install dependencies ─────────────────────────────────────────
step "Installing dependencies..."
(cd "$INSTALL_APP" && "$NPM_BIN" install 2>&1 | tail -3)
success "Dependencies installed"

# ── Build ─────────────────────────────────────────────────────────
step "Building Canopy..."
(cd "$INSTALL_APP" && "$NPM_BIN" run build 2>&1 | tail -3)
success "Build complete"

# ── Create .app bundle ────────────────────────────────────────────
step "Creating macOS application..."

chmod +x "$INSTALL_APP/scripts/create-mac-app.sh"

APP_BUILD_DIR=$(mktemp -d)
"$INSTALL_APP/scripts/create-mac-app.sh" \
  --project "$INSTALL_APP" \
  --output "$APP_BUILD_DIR" 2>&1 | while read -r line; do
    echo "   $line"
  done

if [[ ! -d "$APP_BUILD_DIR/Canopy.app" ]]; then
  fail "Failed to create Canopy.app bundle"
fi

# ── Install to /Applications ─────────────────────────────────────
step "Installing to /Applications..."

if [[ -d "/Applications/Canopy.app" ]]; then
  info "Replacing existing Canopy.app..."
  rm -rf "/Applications/Canopy.app"
fi

mv "$APP_BUILD_DIR/Canopy.app" "/Applications/Canopy.app"
rm -rf "$APP_BUILD_DIR"
success "Canopy.app installed to /Applications"

# ── Add to Dock ──────────────────────────────────────────────────
step "Adding to Dock..."

if defaults read com.apple.dock persistent-apps 2>/dev/null | grep -q "Canopy.app"; then
  success "Already in Dock"
else
  defaults write com.apple.dock persistent-apps -array-add \
    "<dict>
      <key>tile-data</key>
      <dict>
        <key>file-data</key>
        <dict>
          <key>_CFURLString</key>
          <string>/Applications/Canopy.app</string>
          <key>_CFURLStringType</key>
          <integer>0</integer>
        </dict>
      </dict>
    </dict>"
  killall Dock 2>/dev/null || true
  sleep 2  # Give Launch Services time to re-index after Dock restart
  success "Added to Dock"
fi

# ── Launch ────────────────────────────────────────────────────────
step "Launching Canopy..."

open /Applications/Canopy.app
success "Canopy is starting!"

# ── Success ───────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Canopy installed successfully!${NC}"
echo ""
echo "   App:      /Applications/Canopy.app"
echo "   Data:     ~/Library/Application Support/Canopy/"
echo "   Logs:     ~/Library/Logs/Canopy/"
echo ""
echo "   To update:  cd $(basename "$REPO_DIR") && git pull && ./setup.sh"
echo "   To uninstall:"
echo "     1. Delete /Applications/Canopy.app"
echo "     2. Delete ~/Library/Application Support/Canopy/"
echo ""
echo "   The cloned repo can be safely deleted after installation."
echo ""
