export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
  // 稳定的歌曲标识（原始详情页链接），用于收藏等持久化操作
  songKey?: string;
}

export interface Category {
  id: number;
  name: string;
  // 目标站点对应的页面地址与类型（导航分类动态加载时使用）
  url?: string;
  type?: string;
}

export enum PlayMode {
  SEQUENCE = 'sequence', // 顺序播放
  LOOP = 'loop', // 列表循环
  SINGLE = 'single', // 单曲循环
  RANDOM = 'random' // 随机播放
}