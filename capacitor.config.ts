import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.music.app",
  appName: "music",
  webDir: "dist",
  // 允许 WebView 内页面使用 http 明文与本地资源
  server: {
    androidScheme: "https",
    allowNavigation: ["www.22a5.com", "*.22a5.com"],
  },
  android: {
    // 允许加载 http 资源（音乐/图片/歌词）
    allowMixedContent: true,
  },
  plugins: {
    // 关键：把 fetch/XHR 交给原生 HTTP 执行，绕过 WebView 的 CORS 限制
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
