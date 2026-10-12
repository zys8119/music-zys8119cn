// API 服务统一管理（离线 App 版）
// 说明：原项目通过后端 Express 服务代理抓取音乐站点并存储用户数据；
// 转为安卓 App 后，抓取逻辑改为在客户端直接访问目标站点（见 scraper.ts），
// 收藏/最近播放/搜索历史改为本地存储（见 localStore.ts）。
// 对外仍保持 { code, data } 的返回结构，业务组件无需改动。
import { scraper } from "./scraper";
import * as store from "./localStore";

// 统一成功响应包装
function ok<T>(data: T) {
  return Promise.resolve({ code: 200, data });
}

// 统一错误响应包装（与后端 fail() 结构一致）
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

// 音乐相关 API
export const musicApi = {
  // 获取推荐歌手
  getRecommendedSingers: () => guarded(() => scraper.parseSingers()),

  // 获取网友都在听
  getNetizensListening: () => guarded(() => scraper.parseListeningSongs()),

  // 获取热门歌单
  getHotPlaylists: () => guarded(() => scraper.parsePlaylists()),

  // 获取飙升歌曲
  getRisingSongs: () => guarded(() => scraper.parseSongListByUrl("/list/top.html")),

  // 获取热门榜单分类（全站通用）
  getHotRankings: () => guarded(() => scraper.parseHotRankings()),

  // 搜索歌曲（page 从 1 开始）
  search: (wd: string, page = 1) => guarded(() => scraper.parseSearch(wd, page)),

  // 获取热门榜单分类（兼容旧接口）
  getHotList: () =>
    guarded(async () => {
      const all = await scraper.parseNavCategories();
      return all.filter((c) => c.type === "rank");
    }),

  // 获取导航分类（真实站点导航）
  getCategories: () => guarded(() => scraper.parseNavCategories()),

  // 通用列表：根据页面 URL 获取榜单/歌手/歌单/电台/MV 列表
  getList: (url: string) => guarded(() => scraper.parseGenericList(url)),

  // 根据 URL 获取热门歌单详情
  getHotPlayListByUrl: (url: string) => guarded(() => scraper.parseSongListByUrl(url)),

  // 根据 URL 获取歌曲信息
  getSongInfo: (url: string) => guarded(() => scraper.getSongPlayInfo(url)),

  // 根据 URL 获取歌词
  getLyric: (url: string) => guarded(() => scraper.getLyric(url)),

  // ===== 收藏 =====
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

  // ===== 收藏分组 =====
  getFavoriteGroups: () => ok(store.listGroups()),
  addFavoriteGroup: (name: string) => ok(store.addGroup(name)),
  removeFavoriteGroup: (id: number) => {
    store.removeGroup(id);
    return ok({ success: true });
  },

  // ===== 最近播放 =====
  getRecent: () => ok(store.listRecent()),
  addRecent: (song: { title: string; artist?: string; cover?: string; url: string }) => {
    store.addRecent(song);
    return ok({ success: true });
  },
  clearRecent: () => {
    store.clearRecent();
    return ok({ success: true });
  },

  // ===== 搜索历史 =====
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

export default musicApi;
