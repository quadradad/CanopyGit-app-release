# Canopy

Your branches, clearly. A visual Git branch tracker for macOS.

## Requirements

- macOS 12 or later (Monterey+)
- Git (comes pre-installed on most Macs)

Node.js 20+ is also required but will be installed automatically if not found.

## Installation

1. Open **Terminal** (search for "Terminal" in Spotlight, or find it in Applications > Utilities)
2. Copy and paste this into your terminal window, then press Enter:

```
git clone https://github.com/VistaInspect-James/canopy-app.git
cd canopy-app
make install
```

That's it! Canopy will install and launch automatically.

## What the installer does

- Detects or installs Node.js (via Homebrew if needed)
- Installs application files to `~/Library/Application Support/Canopy/`
- Builds the application
- Creates `Canopy.app` in your Applications folder
- Adds Canopy to your Dock
- Launches the app

## Updating

Open Terminal, then copy and paste:

```
cd canopy-app
git pull
make install
```

Your data is preserved automatically — you won't lose anything.

## Uninstalling

1. Drag **Canopy** from your Applications folder to the Trash
2. Open Terminal and paste: `rm -rf ~/Library/Application\ Support/Canopy/`
3. Optionally remove logs: `rm -rf ~/Library/Logs/Canopy/`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Node.js not found" | Install from [nodejs.org](https://nodejs.org) or run `brew install node@22` in Terminal |
| App won't launch | Check logs — open Terminal and run: `open ~/Library/Logs/Canopy/` |
| "Git not found" | Open Terminal and run: `xcode-select --install` |
| Port 3777 in use | Another instance may be running — open Activity Monitor, search for "node", and quit it |
| "permission denied" | Open Terminal and run: `chmod +x setup.sh` then try again |
