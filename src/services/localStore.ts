// 本地数据层：用 localStorage 替代服务端 SQLite，供离线 App 使用

export interface SongInput {
  title: string;
  artist?: string;
  cover?: string;
  url: string;
}

export interface FavoriteRow {
  id: number;
  song_key: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  group_id: number | null;
  group_name: string | null;
  created_at: number;
}

export interface GroupRow {
  id: number;
  name: string;
  created_at: number;
  count: number;
}

export interface RecentRow {
  id: number;
  song_key: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
  played_at: number;
}

export interface SearchRow {
  id: number;
  keyword: string;
  created_at: number;
}

const KEY = {
  favorites: "music.favorites",
  groups: "music.favorite_groups",
  recent: "music.recent_plays",
  search: "music.search_history",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("本地存储写入失败", e);
  }
}

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

// ---------------------------------------------------------------------------
// 收藏
// ---------------------------------------------------------------------------

function readGroups(): Array<{ id: number; name: string; created_at: number }> {
  return read(KEY.groups, [] as Array<{ id: number; name: string; created_at: number }>);
}

function readFavorites(): FavoriteRow[] {
  return read(KEY.favorites, [] as FavoriteRow[]);
}

function withGroupName(rows: FavoriteRow[]): FavoriteRow[] {
  const groups = readGroups();
  return rows.map((f) => ({
    ...f,
    group_name: f.group_id == null ? null : groups.find((g) => g.id === f.group_id)?.name ?? null,
  }));
}

export function listFavorites(groupId?: number | null): FavoriteRow[] {
  let rows = withGroupName(readFavorites());
  if (groupId !== undefined && groupId !== null) {
    rows = rows.filter((f) => f.group_id === groupId);
  }
  return rows.sort((a, b) => b.created_at - a.created_at);
}

export function addFavorite(song: SongInput, groupId?: number | null): FavoriteRow {
  const rows = readFavorites();
  const now = Date.now();
  const existing = rows.find((f) => f.song_key === song.url);
  if (existing) {
    existing.title = song.title;
    existing.artist = song.artist || "";
    existing.cover = song.cover || "";
    existing.url = song.url;
    if (groupId !== undefined && groupId !== null) existing.group_id = groupId;
  } else {
    rows.push({
      id: nextId(rows),
      song_key: song.url,
      title: song.title,
      artist: song.artist || "",
      cover: song.cover || "",
      url: song.url,
      group_id: groupId ?? null,
      group_name: null,
      created_at: now,
    });
  }
  write(KEY.favorites, rows);
  const row = rows.find((f) => f.song_key === song.url)!;
  return withGroupName([row])[0];
}

export function removeFavorite(id: number) {
  write(KEY.favorites, readFavorites().filter((f) => f.id !== id));
}

export function removeFavoriteByUrl(url: string) {
  write(KEY.favorites, readFavorites().filter((f) => f.song_key !== url));
}

export function moveFavorite(id: number, groupId: number | null): FavoriteRow | null {
  const rows = readFavorites();
  const row = rows.find((f) => f.id === id);
  if (!row) return null;
  row.group_id = groupId;
  write(KEY.favorites, rows);
  return withGroupName([row])[0];
}

export function getFavoriteByUrl(url: string): FavoriteRow | null {
  const row = readFavorites().find((f) => f.song_key === url);
  return row ? withGroupName([row])[0] : null;
}

// ---------------------------------------------------------------------------
// 收藏分组
// ---------------------------------------------------------------------------

export function listGroups(): GroupRow[] {
  const groups = readGroups();
  const favorites = readFavorites();
  return groups
    .map((g) => ({
      ...g,
      count: favorites.filter((f) => f.group_id === g.id).length,
    }))
    .sort((a, b) => a.created_at - b.created_at);
}

export function addGroup(name: string): GroupRow {
  const groups = readGroups();
  const row = { id: nextId(groups), name, created_at: Date.now() };
  groups.push(row);
  write(KEY.groups, groups);
  return { ...row, count: 0 };
}

export function removeGroup(id: number) {
  write(KEY.groups, readGroups().filter((g) => g.id !== id));
  const favorites = readFavorites();
  favorites.forEach((f) => {
    if (f.group_id === id) f.group_id = null;
  });
  write(KEY.favorites, favorites);
}

// ---------------------------------------------------------------------------
// 最近播放（最多 50 条）
// ---------------------------------------------------------------------------

const RECENT_LIMIT = 50;

export function listRecent(): RecentRow[] {
  return read(KEY.recent, [] as RecentRow[])
    .sort((a, b) => b.played_at - a.played_at)
    .slice(0, RECENT_LIMIT);
}

export function addRecent(song: SongInput) {
  let rows = read(KEY.recent, [] as RecentRow[]);
  const now = Date.now();
  const existing = rows.find((r) => r.song_key === song.url);
  if (existing) {
    existing.title = song.title;
    existing.artist = song.artist || "";
    existing.cover = song.cover || "";
    existing.url = song.url;
    existing.played_at = now;
  } else {
    rows.push({
      id: nextId(rows),
      song_key: song.url,
      title: song.title,
      artist: song.artist || "",
      cover: song.cover || "",
      url: song.url,
      played_at: now,
    });
  }
  rows = rows.sort((a, b) => b.played_at - a.played_at).slice(0, RECENT_LIMIT);
  write(KEY.recent, rows);
}

export function clearRecent() {
  write(KEY.recent, []);
}

// ---------------------------------------------------------------------------
// 搜索历史
// ---------------------------------------------------------------------------

export function listSearchHistory(limit = 20): SearchRow[] {
  return read(KEY.search, [] as SearchRow[])
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit);
}

export function addSearchHistory(keyword: string) {
  const kw = keyword.trim();
  if (!kw) return;
  const rows = read(KEY.search, [] as SearchRow[]);
  const existing = rows.find((r) => r.keyword === kw);
  if (existing) {
    existing.created_at = Date.now();
  } else {
    rows.push({ id: nextId(rows), keyword: kw, created_at: Date.now() });
  }
  write(KEY.search, rows);
}

export function removeSearchHistory(id: number) {
  write(KEY.search, read(KEY.search, [] as SearchRow[]).filter((r) => r.id !== id));
}

export function clearSearchHistory() {
  write(KEY.search, []);
}
