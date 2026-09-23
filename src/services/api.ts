// API服务统一管理
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

// 获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 0, // 0表示不超时
});

// 通用请求函数
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

// 音乐相关API
export const musicApi = {
  // 获取推荐歌手
  getRecommendedSingers: () => request("/music/recommended-singer"),

  // 获取网友都在听
  getNetizensListening: () => request("/music/netizensAreAllListening"),

  // 获取热门歌单
  getHotPlaylists: () => request("/music/hotPlayList"),

  // 获取飙升歌曲
  getRisingSongs: () => request("/music/songRising"),

  // 获取热门榜单分类（全站通用）
  getHotRankings: () => request("/music/hotRankings"),

  // 搜索歌曲（page 从 1 开始）
  search: (wd: string, page = 1) =>
    request(
      `/music/search?wd=${encodeURIComponent(wd)}&page=${page}`,
    ),

  // 获取热门榜单分类（兼容旧接口）
  getHotList: () => request("/music/hotList"),

  // 获取导航分类（真实站点导航）
  getCategories: () => request("/music/categories"),

  // 通用列表：根据页面 URL 获取榜单/歌手/歌单/电台/MV 列表
  getList: (url: string) =>
    request(`/music/getList?url=${encodeURIComponent(url)}`),

  // 根据URL获取热门歌单详情
  getHotPlayListByUrl: (url: string) =>
    request(`/music/getHotPlayList?url=${encodeURIComponent(url)}`),

  // 根据URL获取歌曲信息
  getSongInfo: (url: string) =>
    request(`/music/get?url=${encodeURIComponent(url)}`),

  // 根据URL获取歌词
  getLyric: (url: string) =>
    request(`/music/lyric?url=${encodeURIComponent(url)}`),

  // ===== 收藏 =====
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
    request(`/music/favorites/${id}`, {
      method: "PATCH",
      data: { groupId },
    }),
  checkFavorite: (url: string) =>
    request(`/music/favorites/check?url=${encodeURIComponent(url)}`),
  removeFavoriteByUrl: (url: string) =>
    request(`/music/favorites/by-url?url=${encodeURIComponent(url)}`, {
      method: "DELETE",
    }),

  // ===== 收藏分组 =====
  getFavoriteGroups: () => request("/music/favorite-groups"),
  addFavoriteGroup: (name: string) =>
    request("/music/favorite-groups", { method: "POST", data: { name } }),
  removeFavoriteGroup: (id: number) =>
    request(`/music/favorite-groups/${id}`, { method: "DELETE" }),

  // ===== 最近播放 =====
  getRecent: () => request("/music/recent"),
  addRecent: (song: { title: string; artist?: string; cover?: string; url: string }) =>
    request("/music/recent", { method: "POST", data: song }),
  clearRecent: () => request("/music/recent", { method: "DELETE" }),

  // ===== 搜索历史 =====
  getSearchHistory: () => request("/music/search-history"),
  addSearchHistory: (keyword: string) =>
    request("/music/search-history", { method: "POST", data: { keyword } }),
  removeSearchHistory: (id: number) =>
    request(`/music/search-history/${id}`, { method: "DELETE" }),
  clearSearchHistory: () =>
    request("/music/search-history", { method: "DELETE" }),
};

// 导出默认API实例
export default musicApi;
