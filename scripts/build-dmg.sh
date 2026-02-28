#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-1.0.0}"
APP_NAME="AgentGuard Desktop"
OUTPUT_DIR="build/bin"
DMG_DIR="build/dmg"
DMG_NAME="AgentGuard-Desktop-${VERSION}-$(uname -m).dmg"

echo "==> Building AgentGuard Desktop v${VERSION} ..."

wails build -clean -ldflags "-X main.AppVersion=${VERSION}"

echo "==> Build complete: ${OUTPUT_DIR}/"

APP_PATH="${OUTPUT_DIR}/${APP_NAME}.app"
if [ ! -d "$APP_PATH" ]; then
  APP_PATH="${OUTPUT_DIR}/agentguard-desktop.app"
fi

if [ ! -d "$APP_PATH" ]; then
  echo "ERROR: .app bundle not found in ${OUTPUT_DIR}"
  ls -la "${OUTPUT_DIR}/"
  exit 1
fi

echo "==> Found app bundle: ${APP_PATH}"

# Code signing (skip if no identity available)
if security find-identity -v -p codesigning 2>/dev/null | grep -q "Developer ID Application"; then
  IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1 | awk -F'"' '{print $2}')
  echo "==> Signing with: ${IDENTITY}"
  codesign --deep --force --options runtime --sign "${IDENTITY}" "${APP_PATH}"
  echo "==> Code signing complete"
else
  echo "==> No signing identity found, skipping code signing"
  echo "    (Users will see 'unidentified developer' warning)"
fi

# Create DMG
echo "==> Creating DMG ..."
rm -rf "${DMG_DIR}"
mkdir -p "${DMG_DIR}"

if command -v create-dmg &>/dev/null; then
  create-dmg \
    --volname "${APP_NAME}" \
    --volicon "build/appicon.png" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 100 \
    --icon "${APP_PATH##*/}" 150 185 \
    --app-drop-link 450 185 \
    --hide-extension "${APP_PATH##*/}" \
    "${DMG_DIR}/${DMG_NAME}" \
    "${APP_PATH}" || true
else
  echo "    create-dmg not found, using hdiutil fallback"
  STAGING="${DMG_DIR}/staging"
  mkdir -p "${STAGING}"
  cp -R "${APP_PATH}" "${STAGING}/"
  ln -s /Applications "${STAGING}/Applications"
  hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${STAGING}" \
    -ov -format UDZO \
    "${DMG_DIR}/${DMG_NAME}"
  rm -rf "${STAGING}"
fi

echo ""
echo "==> DMG created: ${DMG_DIR}/${DMG_NAME}"
echo "    Size: $(du -h "${DMG_DIR}/${DMG_NAME}" | cut -f1)"
