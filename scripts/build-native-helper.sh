#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$root/native-helper/Sources/main.swift"
info_plist="$root/native-helper/Info.plist"
app="$root/native/AE FX Quick Controls.app"
contents="$app/Contents"
macos="$contents/MacOS"
module_cache="${TMPDIR:-/tmp}/ae-fx-swift-module-cache"

rm -rf "$app"
mkdir -p "$macos"
mkdir -p "$module_cache"
cp "$info_plist" "$contents/Info.plist"
printf "APPL????" > "$contents/PkgInfo"

swiftc \
  -O \
  -module-cache-path "$module_cache" \
  -framework Cocoa \
  -framework Carbon \
  -framework WebKit \
  "$root/native-helper/Sources/"*.swift \
  -o "$macos/AEFXQuickControls"

xattr -cr "$app" 2>/dev/null || true
codesign --force --deep --sign - "$app"
echo "built: $app"
