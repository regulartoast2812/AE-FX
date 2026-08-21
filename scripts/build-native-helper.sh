#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_file="$root/native-helper/Sources/main.swift"
info_plist="$root/native-helper/Info.plist"
app="$root/native/AE FX Quick Controls.app"
contents="$app/Contents"
macos="$contents/MacOS"

rm -rf "$app"
mkdir -p "$macos"
cp "$info_plist" "$contents/Info.plist"

swiftc \
  -O \
  -framework Cocoa \
  -framework Carbon \
  -framework WebKit \
  "$root/native-helper/Sources/"*.swift \
  -o "$macos/AEFXQuickControls"

codesign --force --deep --sign - "$app"
echo "built: $app"
