import { watch, type Ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { MediaSession } from "@capgo/capacitor-media-session";

interface MediaSessionSong {
  title: string;
  artist: string;
  album?: string;
  cover?: string;
}

interface UseMediaSessionOptions {
  // 当前歌曲（用于同步锁屏/通知栏/蓝牙设备展示的元数据）
  currentSong: Ref<MediaSessionSong | null>;
  // 播放状态
  isPlaying: Ref<boolean>;
  // 播放进度与总时长（秒）
  currentTime: Ref<number>;
  duration: Ref<number>;
  // 播放控制回调
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (time: number) => void;
  seekBy: (delta: number) => void;
}

// 是否运行在安卓原生环境
const isNative = Capacitor.isNativePlatform();

// 浏览器是否支持 Media Session API
const webSupported =
  typeof navigator !== "undefined" && "mediaSession" in navigator;

// 构建封面图列表（锁屏/通知栏展示）
function buildArtwork(song: MediaSessionSong) {
  if (!song.cover) return [];
  return [
    { src: song.cover, sizes: "96x96", type: "image/png" },
    { src: song.cover, sizes: "128x128", type: "image/png" },
    { src: song.cover, sizes: "192x192", type: "image/png" },
    { src: song.cover, sizes: "256x256", type: "image/png" },
    { src: song.cover, sizes: "384x384", type: "image/png" },
    { src: song.cover, sizes: "512x512", type: "image/png" },
  ];
}

/**
 * 接入 Media Session：
 * 让蓝牙耳机/车载/锁屏的媒体按键（播放、暂停、上一首、下一首、快进快退）能控制本播放器，
 * 并让安卓在通知中心展示播放卡片。
 *
 * - 安卓原生环境：使用 @capgo/capacitor-media-session 原生插件
 *   （Capacitor WebView 不支持 Web Media Session API，必须走原生）
 * - 浏览器环境：回退到 Web Media Session API
 */
export function useMediaSession(options: UseMediaSessionOptions) {
  if (!isNative && !webSupported) return;

  // ===== 注册媒体按键回调 =====
  function registerHandlers() {
    if (isNative) {
      // 原生插件：逐个注册 action 与回调
      MediaSession.setActionHandler({ action: "play" }, () => options.play()).catch(() => { });
      MediaSession.setActionHandler({ action: "pause" }, () => options.pause()).catch(() => { });
      MediaSession.setActionHandler({ action: "previoustrack" }, () => options.prev()).catch(() => { });
      MediaSession.setActionHandler({ action: "nexttrack" }, () => options.next()).catch(() => { });
      MediaSession.setActionHandler({ action: "stop" }, () => options.pause()).catch(() => { });
      MediaSession.setActionHandler({ action: "seekbackward" }, (details) =>
        options.seekBy(-(details.seekTime || 10)),
      ).catch(() => { });
      MediaSession.setActionHandler({ action: "seekforward" }, (details) =>
        options.seekBy(details.seekTime || 10),
      ).catch(() => { });
      MediaSession.setActionHandler({ action: "seekto" }, (details) => {
        if (typeof details.seekTime === "number") options.seekTo(details.seekTime);
      }).catch(() => { });
      return;
    }
    // 浏览器：Web Media Session，部分 action 不支持会抛错，逐个 try
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // 忽略不支持的 action
      }
    };
    set("play", () => options.play());
    set("pause", () => options.pause());
    set("previoustrack", () => options.prev());
    set("nexttrack", () => options.next());
    set("stop", () => options.pause());
    set("seekbackward", (details) => options.seekBy(-(details.seekOffset || 10)));
    set("seekforward", (details) => options.seekBy(details.seekOffset || 10));
    set("seekto", (details) => {
      if (typeof details.seekTime === "number") options.seekTo(details.seekTime);
    });
  }

  registerHandlers();

  // ===== 元数据：歌曲标题/歌手/专辑/封面 =====
  watch(
    options.currentSong,
    (song) => {
      if (!song) {
        if (isNative) {
          MediaSession.setPlaybackState({ playbackState: "none" }).catch(() => { });
        } else {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = "none";
        }
        return;
      }
      const artwork = buildArtwork(song);
      if (isNative) {
        MediaSession.setMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album || "",
          artwork,
        }).catch(() => { });
      } else {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album || "",
          artwork,
        });
      }
    },
    { immediate: true },
  );

  // ===== 播放状态变化 =====
  watch(
    options.isPlaying,
    (playing) => {
      if (isNative) {
        MediaSession.setPlaybackState({
          playbackState: playing ? "playing" : "paused",
        }).catch(() => { });
      } else {
        navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      }
    },
    { immediate: true },
  );

  // ===== 进度同步（节流，避免每帧都调用系统 API） =====
  let lastSync = 0;
  watch([options.currentTime, options.duration, options.isPlaying], () => {
    const now = Date.now();
    // 播放状态切换需立即同步，进度更新按 1 秒节流
    const playingChanged = isNative
      ? false
      : navigator.mediaSession.playbackState !==
      (options.isPlaying.value ? "playing" : "paused");
    if (!playingChanged && now - lastSync < 1000) return;
    lastSync = now;

    const dur = options.duration.value;
    // setPositionState 要求 duration > 0 且 position 合法
    if (!Number.isFinite(dur) || dur <= 0) return;
    const position = Math.min(Math.max(options.currentTime.value, 0), dur);
    if (isNative) {
      MediaSession.setPositionState({
        duration: dur,
        playbackRate: 1,
        position,
      }).catch(() => { });
    } else {
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: 1,
          position,
        });
      } catch {
        // 忽略非法参数
      }
    }
  });
}
