import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 数据库文件路径：项目根目录 data/music.db
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, "music.db");

export const db = new DatabaseSync(DB_PATH);

// 初始化表结构
function init() {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS favorite_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      artist TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      group_id INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (group_id) REFERENCES favorite_groups(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS recent_plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      artist TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );
  `);
}

init();

// ---------------------------------------------------------------------------
// 收藏
// ---------------------------------------------------------------------------
export interface SongInput {
  title: string;
  artist?: string;
  cover?: string;
  url: string;
}

// 收藏列表（可按分组过滤）
export function listFavorites(groupId?: number | null) {
  if (groupId === undefined || groupId === null) {
    return db
      .prepare(
        `SELECT f.*, g.name AS group_name FROM favorites f
         LEFT JOIN favorite_groups g ON g.id = f.group_id
         ORDER BY f.created_at DESC`,
      )
      .all();
  }
  return db
    .prepare(
      `SELECT f.*, g.name AS group_name FROM favorites f
       LEFT JOIN favorite_groups g ON g.id = f.group_id
       WHERE f.group_id = ?
       ORDER BY f.created_at DESC`,
    )
    .all(groupId);
}

// 添加收藏（同一首歌曲已存在时更新分组）
export function addFavorite(song: SongInput, groupId?: number | null) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO favorites (song_key, title, artist, cover, url, group_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(song_key) DO UPDATE SET
       title = excluded.title,
       artist = excluded.artist,
       cover = excluded.cover,
       url = excluded.url,
       group_id = COALESCE(excluded.group_id, favorites.group_id)`,
  ).run(
    song.url,
    song.title,
    song.artist || "",
    song.cover || "",
    song.url,
    groupId ?? null,
    now,
  );
  return db.prepare("SELECT * FROM favorites WHERE song_key = ?").get(song.url);
}

// 删除收藏
export function removeFavorite(id: number) {
  db.prepare("DELETE FROM favorites WHERE id = ?").run(id);
}

// 按歌曲链接删除收藏（用于播放器爱心按钮取消收藏）
export function removeFavoriteByUrl(url: string) {
  db.prepare("DELETE FROM favorites WHERE song_key = ?").run(url);
}

// 移动收藏到分组
export function moveFavorite(id: number, groupId: number | null) {
  db.prepare("UPDATE favorites SET group_id = ? WHERE id = ?").run(groupId, id);
  return db.prepare("SELECT * FROM favorites WHERE id = ?").get(id);
}

// 判断某歌曲是否已收藏
export function isFavorite(url: string) {
  const row = db
    .prepare("SELECT id FROM favorites WHERE song_key = ?")
    .get(url) as { id: number } | undefined;
  return !!row;
}

// 按歌曲链接获取收藏记录
export function getFavoriteByUrl(url: string) {
  return (
    db.prepare("SELECT * FROM favorites WHERE song_key = ?").get(url) ?? null
  );
}

// ---------------------------------------------------------------------------
// 收藏分组
// ---------------------------------------------------------------------------
export function listGroups() {
  return db
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM favorites f WHERE f.group_id = g.id) AS count
       FROM favorite_groups g ORDER BY g.created_at ASC`,
    )
    .all();
}

export function addGroup(name: string) {
  const info = db
    .prepare("INSERT INTO favorite_groups (name, created_at) VALUES (?, ?)")
    .run(name, Date.now());
  return db
    .prepare("SELECT * FROM favorite_groups WHERE id = ?")
    .get(info.lastInsertRowid);
}

export function removeGroup(id: number) {
  // 分组删除后，其下收藏回到未分组（外键 SET NULL 已处理）
  db.prepare("DELETE FROM favorite_groups WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// 最近播放（最多保留 50 条）
// ---------------------------------------------------------------------------
const RECENT_LIMIT = 50;

export function listRecent() {
  return db
    .prepare("SELECT * FROM recent_plays ORDER BY played_at DESC LIMIT ?")
    .all(RECENT_LIMIT);
}

export function addRecent(song: SongInput) {
  db.prepare(
    `INSERT INTO recent_plays (song_key, title, artist, cover, url, played_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(song_key) DO UPDATE SET
       title = excluded.title,
       artist = excluded.artist,
       cover = excluded.cover,
       url = excluded.url,
       played_at = excluded.played_at`,
  ).run(
    song.url,
    song.title,
    song.artist || "",
    song.cover || "",
    song.url,
    Date.now(),
  );
  // 仅保留最近 50 条
  db.prepare(
    `DELETE FROM recent_plays WHERE id NOT IN (
       SELECT id FROM recent_plays ORDER BY played_at DESC LIMIT ?
     )`,
  ).run(RECENT_LIMIT);
}

export function clearRecent() {
  db.exec("DELETE FROM recent_plays");
}

// ---------------------------------------------------------------------------
// 搜索历史
// ---------------------------------------------------------------------------
export function listSearchHistory(limit = 20) {
  return db
    .prepare("SELECT * FROM search_history ORDER BY created_at DESC LIMIT ?")
    .all(limit);
}

export function addSearchHistory(keyword: string) {
  const kw = keyword.trim();
  if (!kw) return;
  db.prepare(
    `INSERT INTO search_history (keyword, created_at) VALUES (?, ?)
     ON CONFLICT(keyword) DO UPDATE SET created_at = excluded.created_at`,
  ).run(kw, Date.now());
}

export function removeSearchHistory(id: number) {
  db.prepare("DELETE FROM search_history WHERE id = ?").run(id);
}

export function clearSearchHistory() {
  db.exec("DELETE FROM search_history");
}
