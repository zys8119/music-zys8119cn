// API 服务统一管理（浏览器 + 安卓 双环境）
// - 安卓 App（Capacitor 原生环境）：直接访问目标站点抓取，用户数据存本地（scraper.ts / localStore.ts）
// - 浏览器环境：继续请求 Express 后端服务（VITE_API_BASE_URL）
// 两条路径对外都返回 { code, data }，业务组件无需改动。
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { Capacitor } from "@capacitor/core";
import { scraper } from "./scraper";
import * as store from "./localStore";

// 是否运行在安卓原生环境（打包后的 App）
const IS_NATIVE = Capacitor.isNativePlatform();

// ---------------------------------------------------------------------------
// 浏览器环境：走 Express 后端
// ---------------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 0, // 0 表示不超时
});

async function request(endpoint: string, options?: AxiosRequestConfig) {
  try {
    const response = await apiClient({
      url: endpoint,
      method: "GET",
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error(`API request failed: ${API_BASE_URL}${endpoint}`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 安卓环境：本地抓取 + 本地存储
// ---------------------------------------------------------------------------
function ok<T>(data: T) {
  return Promise.resolve({ code: 200, data });
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("请求失败:", message);
  return { code: 500, message, data: null };
}

// 包装抓取逻辑，失败时返回 { code: 500 }
async function guarded<T>(fn: () => Promise<T>) {
  try {
    return await ok(await fn());
  } catch (e) {
    return fail(e);
  }
}

// 原生环境下的音乐接口实现
const nativeMusicApi = {
  getRecommendedSingers: () => guarded(() => scraper.parseSingers()),
  getNetizensListening: () => guarded(() => scraper.parseListeningSongs()),
  getHotPlaylists: () => guarded(() => scraper.parsePlaylists()),
  getRisingSongs: () => guarded(() => scraper.parseSongListByUrl("/list/top.html")),
  getHotRankings: () => guarded(() => scraper.parseHotRankings()),
  search: (wd: string, page = 1) => guarded(() => scraper.parseSearch(wd, page)),
  getHotList: () =>
    guarded(async () => {
      const all = await scraper.parseNavCategories();
      return all.filter((c) => c.type === "rank");
    }),
  getCategories: () => guarded(() => scraper.parseNavCategories()),
  getList: (url: string) => guarded(() => scraper.parseGenericList(url)),
  getHotPlayListByUrl: (url: string) => guarded(() => scraper.parseSongListByUrl(url)),
  getSongInfo: (url: string) => guarded(() => scraper.getSongPlayInfo(url)),
  getLyric: (url: string) => guarded(() => scraper.getLyric(url)),

  getFavorites: (groupId?: number) => ok(store.listFavorites(groupId)),
  addFavorite: (song: { title: string; artist?: string; cover?: string; url: string }, groupId?: number | null) =>
    ok(store.addFavorite(song, groupId)),
  removeFavorite: (id: number) => {
    store.removeFavorite(id);
    return ok({ success: true });
  },
  moveFavorite: (id: number, groupId: number | null) => ok(store.moveFavorite(id, groupId)),
  checkFavorite: (url: string) => {
    const item = store.getFavoriteByUrl(url);
    return ok({ favorite: !!item, item });
  },
  removeFavoriteByUrl: (url: string) => {
    store.removeFavoriteByUrl(url);
    return ok({ success: true });
  },

  getFavoriteGroups: () => ok(store.listGroups()),
  addFavoriteGroup: (name: string) => ok(store.addGroup(name)),
  removeFavoriteGroup: (id: number) => {
    store.removeGroup(id);
    return ok({ success: true });
  },

  getRecent: () => ok(store.listRecent()),
  addRecent: (song: { title: string; artist?: string; cover?: string; url: string }) => {
    store.addRecent(song);
    return ok({ success: true });
  },
  clearRecent: () => {
    store.clearRecent();
    return ok({ success: true });
  },

  getSearchHistory: () => ok(store.listSearchHistory()),
  addSearchHistory: (keyword: string) => {
    store.addSearchHistory(keyword);
    return ok({ success: true });
  },
  removeSearchHistory: (id: number) => {
    store.removeSearchHistory(id);
    return ok({ success: true });
  },
  clearSearchHistory: () => {
    store.clearSearchHistory();
    return ok({ success: true });
  },
};

// ---------------------------------------------------------------------------
// 浏览器环境：调用 Express 后端
// ---------------------------------------------------------------------------
const webMusicApi = {
  getRecommendedSingers: () => request("/music/recommended-singer"),
  getNetizensListening: () => request("/music/netizensAreAllListening"),
  getHotPlaylists: () => request("/music/hotPlayList"),
  getRisingSongs: () => request("/music/songRising"),
  getHotRankings: () => request("/music/hotRankings"),
  search: (wd: string, page = 1) =>
    request(`/music/search?wd=${encodeURIComponent(wd)}&page=${page}`),
  getHotList: () => request("/music/hotList"),
  getCategories: () => request("/music/categories"),
  getList: (url: string) => request(`/music/getList?url=${encodeURIComponent(url)}`),
  getHotPlayListByUrl: (url: string) =>
    request(`/music/getHotPlayList?url=${encodeURIComponent(url)}`),
  getSongInfo: (url: string) => request(`/music/get?url=${encodeURIComponent(url)}`),
  getLyric: (url: string) => request(`/music/lyric?url=${encodeURIComponent(url)}`),

  getFavorites: (groupId?: number) =>
    request(
      groupId !== undefined
        ? `/music/favorites?groupId=${groupId}`
        : "/music/favorites",
    ),
  addFavorite: (song: { title: string; artist?: string; cover?: string; url: string }, groupId?: number | null) =>
    request("/music/favorites", {
      method: "POST",
      data: { ...song, groupId },
    }),
  removeFavorite: (id: number) =>
    request(`/music/favorites/${id}`, { method: "DELETE" }),
  moveFavorite: (id: number, groupId: number | null) =>
    request(`/music/favorites/${id}`, { method: "PATCH", data: { groupId } }),
  checkFavorite: (url: string) =>
    request(`/music/favorites/check?url=${encodeURIComponent(url)}`),
  removeFavoriteByUrl: (url: string) =>
    request(`/music/favorites/by-url?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
    }),

  getFavoriteGroups: () => request("/music/favorite-groups"),
  addFavoriteGroup: (name: string) =>
    request("/music/favorite-groups", { method: "POST", data: { name } }),
  removeFavoriteGroup: (id: number) =>
    request(`/music/favorite-groups/${id}`, { method: "DELETE" }),

  getRecent: () => request("/music/recent"),
  addRecent: (song: { title: string; artist?: string; cover?: string; url: string }) =>
    request("/music/recent", { method: "POST", data: song }),
  clearRecent: () => request("/music/recent", { method: "DELETE" }),

  getSearchHistory: () => request("/music/search-history"),
  addSearchHistory: (keyword: string) =>
    request("/music/search-history", { method: "POST", data: { keyword } }),
  removeSearchHistory: (id: number) =>
    request(`/music/search-history/${id}`, { method: "DELETE" }),
  clearSearchHistory: () =>
    request("/music/search-history", { method: "DELETE" }),
};

// 根据运行环境自动选择实现
export const musicApi = IS_NATIVE ? nativeMusicApi : webMusicApi;

export default musicApi;
