export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  category: number;
  cover: string;
  url: string;
}

export interface Category {
  id: number;
  name: string;
}

export enum PlayMode {
  SEQUENCE = 'sequence', // 顺序播放
  LOOP = 'loop', // 列表循环
  SINGLE = 'single', // 单曲循环
  RANDOM = 'random' // 随机播放
}