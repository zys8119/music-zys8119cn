// API服务统一管理
import axios from "axios";
import type { AxiosRequestConfig } from "axios";

// 获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
console.log(API_BASE_URL);
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env);
// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10秒超时
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

  // 获取热门榜单分类
  getHotList: () => request("/music/hotList"),

  // 根据URL获取热门歌单详情
  getHotPlayListByUrl: (url: string) =>
    request(`/music/getHotPlayList?url=${encodeURIComponent(url)}`),

  // 根据URL获取歌曲信息
  getSongInfo: (url: string) =>
    request(`/music/get?url=${encodeURIComponent(url)}`),
};

// 导出默认API实例
export default musicApi;
