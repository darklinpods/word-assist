#!/bin/bash
# 强制退出 Typeless
pkill -x "Typeless" 2>/dev/null

# 删除所有相关文件
rm -rf \
  /Applications/Typeless.app \
  ~/Library/Application\ Support/Typeless \
  ~/Library/Application\ Support/now.typeless.desktop \
  ~/Library/Preferences/now.typeless.desktop.plist \
  ~/Library/Preferences/ByHost/now.typeless.desktop.*.plist \
  ~/Library/Caches/now.typeless.desktop \
  ~/Library/Caches/now.typeless.desktop.ShipIt \
  ~/Library/Caches/typeless-updater \
  ~/Library/HTTPStorages/now.typeless.desktop

echo "Typeless 已完整卸载。"
