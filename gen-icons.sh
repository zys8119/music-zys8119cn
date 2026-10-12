#!/usr/bin/env bash
# 用 macOS 自带 sips 从源图生成安卓各分辨率图标
set -e
SRC="/Users/zhangyunshan/work/music-zys8119cn/resources/logo.png"
RES="/Users/zhangyunshan/work/music-zys8119cn/android/app/src/main/res"

make_set() {
  local dir="$1" icon="$2" fg="$3"
  mkdir -p "$RES/$dir"
  sips -z "$icon" "$icon" "$SRC" --out "$RES/$dir/ic_launcher.png" >/dev/null
  sips -z "$icon" "$icon" "$SRC" --out "$RES/$dir/ic_launcher_round.png" >/dev/null
  sips -z "$fg" "$fg" "$SRC" --out "$RES/$dir/ic_launcher_foreground.png" >/dev/null
  echo "$dir done"
}

make_set mipmap-mdpi 48 108
make_set mipmap-hdpi 72 162
make_set mipmap-xhdpi 96 216
make_set mipmap-xxhdpi 144 324
make_set mipmap-xxxhdpi 192 432

echo ALL_DONE
