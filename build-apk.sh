#!/usr/bin/env bash
# 一键打包安卓 APK（debug）
# 用法: pnpm android:apk  或  sh ./build-apk.sh
set -euo pipefail

# ---- 构建工具链路径（本机免安装下载的 JDK 21 与 Android SDK）----
JAVA_HOME="/Users/zhangyunshan/android-tools/jdk-21.0.5+11/Contents/Home"
ANDROID_HOME="/Users/zhangyunshan/android-tools/sdk"
export JAVA_HOME
export ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

# ---- 定位项目根目录 ----
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ---- 校验工具链 ----
if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "错误: 未找到 JDK 21 ($JAVA_HOME)" >&2
  exit 1
fi
if [ ! -d "$ANDROID_HOME/platforms" ]; then
  echo "错误: 未找到 Android SDK ($ANDROID_HOME)" >&2
  exit 1
fi

# ---- 1. 构建前端并同步到原生工程 ----
echo "==> 构建前端并同步到 Android 工程"
pnpm exec vite build
pnpm exec cap sync android

# ---- 2. 编译 debug APK ----
echo "==> 编译 debug APK"
cd "$ROOT_DIR/android"
./gradlew assembleDebug --no-daemon

APK="$ROOT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "==> 打包完成: $APK"
ls -lh "$APK"
