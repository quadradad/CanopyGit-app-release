#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# create-mac-app.sh — Generate a macOS .app bundle for Canopy
#
# Creates a native-looking macOS application that:
#   1. Starts the Canopy web server
#   2. Opens a chromeless browser window (Chrome --app= mode)
#   3. Cleans up the server when the window closes
#
# Usage:
#   ./scripts/create-mac-app.sh [OPTIONS]
#
# Options:
#   --icon <path>       Path to icon file (PNG 1024x1024 or .icns)
#   --name <name>       App name (default: "Canopy")
#   --port <port>       Server port (default: 3777)
#   --output <dir>      Output directory (default: ./dist)
#   --project <dir>     Canopy project root (default: script's parent dir)
#   --width <px>        Window width (default: 1280)
#   --height <px>       Window height (default: 820)
#
# Example:
#   ./scripts/create-mac-app.sh --icon ~/my-icon.png --port 4000
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Defaults ────────────────────────────────────────────────────────
APP_NAME="Canopy"
PORT=3777
OUTPUT_DIR=""
PROJECT_DIR=""
ICON_PATH=""
WIN_WIDTH=1280
WIN_HEIGHT=820

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEFAULT_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Parse arguments ─────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --icon)    ICON_PATH="$2";    shift 2 ;;
    --name)    APP_NAME="$2";     shift 2 ;;
    --port)    PORT="$2";         shift 2 ;;
    --output)  OUTPUT_DIR="$2";   shift 2 ;;
    --project) PROJECT_DIR="$2";  shift 2 ;;
    --width)   WIN_WIDTH="$2";    shift 2 ;;
    --height)  WIN_HEIGHT="$2";   shift 2 ;;
    -h|--help)
      sed -n '2,/^# ─────/p' "$0" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

PROJECT_DIR="${PROJECT_DIR:-$DEFAULT_PROJECT_DIR}"
OUTPUT_DIR="${OUTPUT_DIR:-$PROJECT_DIR/dist}"

# ── Validate ────────────────────────────────────────────────────────
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
  echo "❌ No package.json found at $PROJECT_DIR" >&2
  echo "   Use --project to specify the Canopy project root." >&2
  exit 1
fi

if [[ -n "$ICON_PATH" && ! -f "$ICON_PATH" ]]; then
  echo "❌ Icon file not found: $ICON_PATH" >&2
  exit 1
fi

# ── Paths ───────────────────────────────────────────────────────────
APP_BUNDLE="$OUTPUT_DIR/${APP_NAME}.app"
CONTENTS="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS/MacOS"
RESOURCES_DIR="$CONTENTS/Resources"

echo "🌿 Creating ${APP_NAME}.app bundle..."
echo "   Project:  $PROJECT_DIR"
echo "   Output:   $APP_BUNDLE"
echo "   Port:     $PORT"
echo "   Window:   ${WIN_WIDTH}×${WIN_HEIGHT}"

# ── Clean previous build ────────────────────────────────────────────
rm -rf "$APP_BUNDLE"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

# ── Convert icon to .icns ──────────────────────────────────────────
ICNS_PATH="$RESOURCES_DIR/app.icns"

if [[ -n "$ICON_PATH" ]]; then
  EXT="${ICON_PATH##*.}"
  EXT_LOWER="$(echo "$EXT" | tr '[:upper:]' '[:lower:]')"

  if [[ "$EXT_LOWER" == "icns" ]]; then
    echo "   Icon:     $ICON_PATH (copying .icns directly)"
    cp "$ICON_PATH" "$ICNS_PATH"
  elif [[ "$EXT_LOWER" == "png" || "$EXT_LOWER" == "jpg" || "$EXT_LOWER" == "jpeg" || "$EXT_LOWER" == "tiff" ]]; then
    echo "   Icon:     $ICON_PATH (converting to .icns)"

    ICONSET_DIR=$(mktemp -d)/app.iconset
    mkdir -p "$ICONSET_DIR"

    # Generate all required sizes from source image
    for SIZE in 16 32 64 128 256 512 1024; do
      sips -z $SIZE $SIZE "$ICON_PATH" --out "$ICONSET_DIR/icon_${SIZE}x${SIZE}.png" >/dev/null 2>&1
    done

    # Create @2x variants (macOS convention)
    cp "$ICONSET_DIR/icon_32x32.png"    "$ICONSET_DIR/icon_16x16@2x.png"
    cp "$ICONSET_DIR/icon_64x64.png"    "$ICONSET_DIR/icon_32x32@2x.png"
    cp "$ICONSET_DIR/icon_256x256.png"  "$ICONSET_DIR/icon_128x128@2x.png"
    cp "$ICONSET_DIR/icon_512x512.png"  "$ICONSET_DIR/icon_256x256@2x.png"
    cp "$ICONSET_DIR/icon_1024x1024.png" "$ICONSET_DIR/icon_512x512@2x.png"
    rm -f "$ICONSET_DIR/icon_64x64.png" "$ICONSET_DIR/icon_1024x1024.png"

    iconutil -c icns "$ICONSET_DIR" -o "$ICNS_PATH"
    rm -rf "$(dirname "$ICONSET_DIR")"
    echo "   ✓ Icon converted to .icns"
  else
    echo "⚠️  Unsupported icon format: .$EXT_LOWER (use PNG, JPG, TIFF, or ICNS)" >&2
    echo "   Proceeding without custom icon."
    ICNS_PATH=""
  fi
elif [[ -f "$PROJECT_DIR/resources/icon.icns" ]]; then
  echo "   Icon:     Using existing resources/icon.icns"
  cp "$PROJECT_DIR/resources/icon.icns" "$ICNS_PATH"
else
  echo "   Icon:     None (will use default macOS icon)"
  ICNS_PATH=""
fi

# ── Generate Info.plist ─────────────────────────────────────────────
BUNDLE_ID="com.canopy.app"
ICON_FILE=""
if [[ -n "$ICNS_PATH" ]]; then
  ICON_FILE="app"
fi

cat > "$CONTENTS/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}</string>
  <key>CFBundleVersion</key>
  <string>1.0.0</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIconFile</key>
  <string>${ICON_FILE}</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
PLIST

echo "   ✓ Info.plist generated"

# ── Generate launch script ──────────────────────────────────────────
cat > "$MACOS_DIR/launch" << 'LAUNCHER_HEADER'
#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Canopy launcher — starts server, opens browser, cleans up on exit
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

LAUNCHER_HEADER

cat >> "$MACOS_DIR/launch" << LAUNCHER_CONFIG
# ── Configuration (written by create-mac-app.sh) ────────────────────
PROJECT_DIR="$PROJECT_DIR"
PORT=$PORT
WIN_WIDTH=$WIN_WIDTH
WIN_HEIGHT=$WIN_HEIGHT
APP_NAME="$APP_NAME"

LAUNCHER_CONFIG

cat >> "$MACOS_DIR/launch" << 'LAUNCHER_BODY'
# ── Logging ─────────────────────────────────────────────────────────
LOG_DIR="$HOME/Library/Logs/Canopy"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/canopy-$(date +%Y%m%d).log"

log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG_FILE"; }
log "──── Canopy starting ────"

# ── Find Node.js ────────────────────────────────────────────────────
find_node() {
  # Check for bundled Node.js first (distributed installs)
  local bundled="${PROJECT_DIR}/../node/bin/node"
  if [[ -x "$bundled" ]]; then
    echo "$bundled"
    return 0
  fi

  # Check common locations since .app bundles don't inherit shell PATH
  local candidates=(
    "$HOME/.nvm/versions/node/$(ls -1 "$HOME/.nvm/versions/node/" 2>/dev/null | sort -V | tail -1)/bin/node"
    "$HOME/.volta/bin/node"
    "$HOME/.fnm/aliases/default/bin/node"
    "/opt/homebrew/bin/node"
    "/usr/local/bin/node"
    "/usr/bin/node"
  )
  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  # Last resort: try PATH
  command -v node 2>/dev/null && return 0
  return 1
}

NODE_BIN=$(find_node) || {
  osascript -e "display dialog \"Node.js not found.\\n\\nCanopy requires Node.js to run.\\nInstall it from https://nodejs.org\" buttons {\"OK\"} default button 1 with icon stop with title \"$APP_NAME\""
  exit 1
}

NODE_DIR="$(dirname "$NODE_BIN")"
export PATH="$NODE_DIR:$PATH"

log "Node: $NODE_BIN ($(\"$NODE_BIN\" --version))"

# ── Verify project ─────────────────────────────────────────────────
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
  osascript -e "display dialog \"Project not found at:\\n$PROJECT_DIR\\n\\nThe project may have been moved.\" buttons {\"OK\"} default button 1 with icon stop with title \"$APP_NAME\""
  exit 1
fi

cd "$PROJECT_DIR"

# ── Check if port is already in use ────────────────────────────────
if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  log "Port $PORT already in use — assuming server is running"
  SERVER_PID=""
  SERVER_ALREADY_RUNNING=true
else
  SERVER_ALREADY_RUNNING=false
fi

# ── Start server ────────────────────────────────────────────────────
if [[ "$SERVER_ALREADY_RUNNING" == false ]]; then
  log "Starting server on port $PORT..."

  CANOPY_PORT=$PORT "$NODE_BIN" "$PROJECT_DIR/dist/server/index.js" >> "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  log "Server PID: $SERVER_PID"

  # Wait for server to be ready (up to 15 seconds)
  ATTEMPTS=0
  MAX_ATTEMPTS=30
  while [[ $ATTEMPTS -lt $MAX_ATTEMPTS ]]; do
    if curl -sf "http://localhost:$PORT/health" >/dev/null 2>&1; then
      log "Server ready after $((ATTEMPTS / 2))s"
      break
    fi
    sleep 0.5
    ATTEMPTS=$((ATTEMPTS + 1))

    # Check if server process died
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      log "Server process died unexpectedly"
      osascript -e "display dialog \"$APP_NAME failed to start.\\n\\nCheck logs at:\\n$LOG_FILE\" buttons {\"OK\"} default button 1 with icon stop with title \"$APP_NAME\""
      exit 1
    fi
  done

  if [[ $ATTEMPTS -ge $MAX_ATTEMPTS ]]; then
    log "Server failed to start within 15s"
    kill "$SERVER_PID" 2>/dev/null || true
    osascript -e "display dialog \"$APP_NAME server timed out.\\n\\nCheck logs at:\\n$LOG_FILE\" buttons {\"OK\"} default button 1 with icon stop with title \"$APP_NAME\""
    exit 1
  fi
fi

# ── Cleanup function ────────────────────────────────────────────────
cleanup() {
  log "Shutting down..."
  if [[ "$SERVER_ALREADY_RUNNING" == false && -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    # Give it a moment to shut down gracefully
    sleep 1
    kill -9 "$SERVER_PID" 2>/dev/null || true
    log "Server stopped (PID $SERVER_PID)"
  fi
  log "──── Canopy stopped ────"
}
trap cleanup EXIT INT TERM

# ── Detect browser ──────────────────────────────────────────────────
APP_URL="http://localhost:$PORT"
BROWSER_PID=""

# Remove stale singleton locks from a previous browser session.
# These prevent Chrome from cleanly starting with our user-data-dir.
clean_browser_locks() {
  local profile_dir="$HOME/Library/Application Support/Canopy/browser-profile"
  rm -f "$profile_dir/SingletonLock" \
        "$profile_dir/SingletonSocket" \
        "$profile_dir/SingletonCookie" 2>/dev/null || true
}

# Poll for a Chrome/Chromium window with our app URL via AppleScript.
# Returns when the window is no longer found.
poll_for_window_close() {
  local browser_name="$1"
  while true; do
    sleep 3
    WINDOW_EXISTS=$(osascript -e '
      tell application "System Events"
        if not (exists process "'"$browser_name"'") then return "no"
      end tell
      tell application "'"$browser_name"'"
        repeat with w in windows
          if URL of active tab of w starts with "http://localhost:'"$PORT"'" then return "yes"
        end repeat
      end tell
      return "no"
    ' 2>/dev/null || echo "no")

    if [[ "$WINDOW_EXISTS" != "yes" ]]; then
      log "Browser window closed (detected via polling)"
      break
    fi
  done
}

detect_and_launch_browser() {
  # Priority: Chrome (app mode) → Brave → Edge → Chromium → Safari → default
  # Paired arrays: .app bundles (for open -na) and binaries (for -x checks)
  local app_bundles=(
    "/Applications/Google Chrome.app"
    "/Applications/Google Chrome Canary.app"
    "/Applications/Brave Browser.app"
    "/Applications/Microsoft Edge.app"
    "/Applications/Chromium.app"
  )
  local browser_binaries=(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  )

  clean_browser_locks

  local i
  for i in "${!browser_binaries[@]}"; do
    if [[ -x "${browser_binaries[$i]}" ]]; then
      local app_bundle="${app_bundles[$i]}"
      log "Launching: $app_bundle (app mode via open -na)"
      open -na "$app_bundle" --args \
        --app="$APP_URL" \
        --window-size="$WIN_WIDTH,$WIN_HEIGHT" \
        --window-position=center \
        --disable-extensions \
        --no-first-run \
        --no-default-browser-check \
        --user-data-dir="$HOME/Library/Application Support/Canopy/browser-profile"
      sleep 2
      BROWSER_PID=$(pgrep -f "user-data-dir=.*browser-profile" | head -1 || true)
      log "Browser PID: ${BROWSER_PID:-unknown}"
      return 0
    fi
  done

  # Safari — use AppleScript for window sizing
  if [[ -d "/Applications/Safari.app" ]]; then
    log "Launching: Safari (AppleScript-sized window)"
    osascript << SAFARI_SCRIPT
      tell application "Safari"
        activate
        make new document with properties {URL:"$APP_URL"}
        delay 1
        set bounds of front window to {100, 100, $((100 + WIN_WIDTH)), $((100 + WIN_HEIGHT))}
      end tell
SAFARI_SCRIPT
    BROWSER_PID=$(pgrep -n Safari || true)
    return 0
  fi

  # Fallback: system default browser (no size control)
  log "Launching: default browser"
  open "$APP_URL"
  sleep 2
  return 0
}

detect_and_launch_browser

# ── Wait for browser to close ───────────────────────────────────────
if [[ -n "$BROWSER_PID" ]]; then
  log "Waiting for browser (PID $BROWSER_PID) to close..."
  sleep 2
  if kill -0 "$BROWSER_PID" 2>/dev/null; then
    # PID is alive — wait for it directly
    log "Browser running as independent process"
    wait "$BROWSER_PID" 2>/dev/null || true
    log "Browser window closed"
  else
    # PID exited — fall back to AppleScript window polling
    log "Browser PID exited — polling for app window"
    poll_for_window_close "Google Chrome"
  fi
else
  # No PID to track. Keep server running until user kills the app.
  log "No browser PID to track — server will run until app is quit"
  while true; do sleep 60; done
fi

# cleanup runs via trap
LAUNCHER_BODY

chmod +x "$MACOS_DIR/launch"
echo "   ✓ Launch script generated"

# ── Done ────────────────────────────────────────────────────────────
echo ""
echo "✅ ${APP_NAME}.app created at:"
echo "   $APP_BUNDLE"
echo ""
echo "   To install: drag to /Applications or double-click to run"
echo "   Logs:       ~/Library/Logs/Canopy/"
echo ""
echo "   To test the .app bundle:"
echo "      open \"$APP_BUNDLE\""
