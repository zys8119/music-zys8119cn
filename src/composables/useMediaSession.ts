import { watch, type Ref } from "vue";

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

// 浏览器是否支持 Media Session API（蓝牙/耳机按键控制依赖该 API）
const supported =
  typeof navigator !== "undefined" && "mediaSession" in navigator;

// 安全注册 action handler：部分浏览器不支持个别 action，会抛错
function setActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  if (!supported) return;
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // 忽略不支持的 action
  }
}

// 构建封面图列表（锁屏/通知栏展示）
function buildArtwork(song: MediaSessionSong): MediaMetadataInit["artwork"] {
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

// 同步播放进度到系统（支持锁屏进度条拖动）
function syncPositionState(
  currentTime: number,
  duration: number,
  isPlaying: boolean,
) {
  if (!supported) return;
  // setPositionState 要求 duration > 0 且 position 合法，否则会抛错
  if (!Number.isFinite(duration) || duration <= 0) return;
  const position = Math.min(Math.max(currentTime, 0), duration);
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position,
    });
  } catch {
    // 忽略非法参数
  }
  // 播放状态同步，蓝牙设备据此判断是否显示播放/暂停
  navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
}

/**
 * 接入 Media Session API：
 * 让蓝牙耳机/车载/锁屏的媒体按键（播放、暂停、上一首、下一首、快进快退）能控制本播放器。
 */
export function useMediaSession(options: UseMediaSessionOptions) {
  if (!supported) return;

  // ===== 注册媒体按键回调 =====
  setActionHandler("play", () => options.play());
  setActionHandler("pause", () => options.pause());
  setActionHandler("previoustrack", () => options.prev());
  setActionHandler("nexttrack", () => options.next());
  setActionHandler("stop", () => options.pause());
  setActionHandler("seekbackward", (details) => {
    // 未指定步长时默认回退 10 秒
    options.seekBy(-(details.seekOffset || 10));
  });
  setActionHandler("seekforward", (details) => {
    // 未指定步长时默认前进 10 秒
    options.seekBy(details.seekOffset || 10);
  });
  setActionHandler("seekto", (details) => {
    if (typeof details.seekTime === "number") {
      options.seekTo(details.seekTime);
    }
  });

  // ===== 元数据：歌曲标题/歌手/专辑/封面 =====
  watch(
    options.currentSong,
    (song) => {
      if (!song) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
        return;
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        artwork: buildArtwork(song),
      });
    },
    { immediate: true },
  );

  // ===== 播放状态变化 =====
  watch(
    options.isPlaying,
    (playing) => {
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    },
    { immediate: true },
  );

  // ===== 进度同步（节流，避免每帧都调用系统 API） =====
  let lastSync = 0;
  watch([options.currentTime, options.duration, options.isPlaying], () => {
    const now = Date.now();
    // 播放状态切换需立即同步，进度更新按 1 秒节流
    const playingChanged =
      navigator.mediaSession.playbackState !==
      (options.isPlaying.value ? "playing" : "paused");
    if (!playingChanged && now - lastSync < 1000) return;
    lastSync = now;
    syncPositionState(
      options.currentTime.value,
      options.duration.value,
      options.isPlaying.value,
    );
  });
}
