// 客户端抓取与解析层：移植自 server/main.ts，供离线 App 直接访问目标音乐站点
// 使用 CapacitorHttp 走原生 HTTP，绕过 WebView 的 CORS 限制，并手动维护 Cookie 会话
import { CapacitorHttp } from "@capacitor/core";

const BASE = "https://www.22a5.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// ---------------------------------------------------------------------------
// HTTP 与 Cookie 会话（目标站点有“安全人机验证”）
// ---------------------------------------------------------------------------
let cookieJar = "";
let verifiedAt = 0;
const VERIFY_TTL = 55 * 60 * 1000;

function mergeCookies(setCookies: string[]) {
  const jar = new Map<string, string>();
  for (const part of cookieJar.split(";")) {
    const [k, v] = part.split("=").map((s) => s && s.trim());
    if (k) jar.set(k, v || "");
  }
  for (const sc of setCookies) {
    const pair = sc.split(";")[0];
    const [k, v] = pair.split("=").map((s) => s && s.trim());
    if (k) jar.set(k, v || "");
  }
  cookieJar = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function extractSetCookies(headers: Record<string, string>): string[] {
  const out: string[] = [];
  for (const key of Object.keys(headers || {})) {
    if (key.toLowerCase() === "set-cookie") {
      const raw = headers[key];
      if (Array.isArray(raw)) out.push(...raw);
      else if (typeof raw === "string") out.push(raw);
    }
  }
  return out;
}

function baseHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": UA,
    "Accept-Language": "zh-CN,zh;q=0.9",
    Referer: BASE + "/",
    ...extra,
  };
  if (cookieJar) headers.Cookie = cookieJar;
  return headers;
}

interface HttpOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  referer?: string;
}

async function httpRequest(
  url: string,
  options: HttpOptions = {},
): Promise<string> {
  const headers = baseHeaders({
    ...(options.referer ? { Referer: options.referer } : {}),
    ...(options.headers || {}),
  });
  const res = await CapacitorHttp.request({
    url,
    method: options.method || "GET",
    headers,
    data: options.body,
    responseType: "text",
  });
  mergeCookies(extractSetCookies(res.headers as Record<string, string>));
  return typeof res.data === "string" ? res.data : String(res.data ?? "");
}

async function ensureVerified(force = false) {
  if (!force && cookieJar && Date.now() - verifiedAt < VERIFY_TTL) return;

  const homeHtml = await httpRequest(BASE + "/");
  const token = homeHtml.match(/name="csrf_token"\s+value="([^"]+)"/)?.[1];

  if (token) {
    await httpRequest(BASE + "/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: BASE,
      },
      body: `csrf_token=${encodeURIComponent(token)}&human_check=on`,
    });
  }
  verifiedAt = Date.now();
}

async function fetchPage(target: string): Promise<string> {
  await ensureVerified();
  const url = target.startsWith("http") ? target : BASE + target;
  let html = await httpRequest(url);

  if (html.includes("安全人机验证") || html.includes("我不是人机")) {
    await ensureVerified(true);
    html = await httpRequest(url);
  }
  return html;
}

// ---------------------------------------------------------------------------
// DOM 解析工具
// ---------------------------------------------------------------------------
function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function absUrl(href?: string | null): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return BASE + (href.startsWith("/") ? href : "/" + href);
}

function attrOrText(el: Element | null, attr = "title"): string {
  if (!el) return "";
  return el.getAttribute(attr) || el.textContent?.trim() || "";
}

// ---------------------------------------------------------------------------
// 解析函数
// ---------------------------------------------------------------------------
function parseSingers(html: string) {
  const doc = parseHtml(html);
  const list: Array<{ url: string; img: string; name: string }> = [];
  doc.querySelectorAll(".lksinger_list ul li").forEach((li) => {
    const a = li.querySelector(".pic a");
    const img = li.querySelector(".pic img")?.getAttribute("src") || "";
    const nameEl = li.querySelector(".name a");
    list.push({
      url: absUrl(a?.getAttribute("href")),
      img,
      name: attrOrText(nameEl),
    });
  });
  return list;
}

function parseListeningSongs(html: string) {
  const doc = parseHtml(html);
  const list: Array<{
    url: string;
    img: string;
    music: string;
    time: string;
    singer: string;
    playTime: string;
  }> = [];
  doc.querySelectorAll(".lkmusic_list ul li").forEach((li) => {
    const a = li.querySelector(".list_r .name a.url");
    const img = li.querySelector(".pic img")?.getAttribute("src") || "";
    const music = attrOrText(a);
    const time =
      li.querySelector(".list_r .name .time")?.textContent?.trim() || "";
    const singer =
      li.querySelector(".list_r p a.singer")?.textContent?.trim() || "";
    list.push({
      url: absUrl(a?.getAttribute("href")),
      img,
      music,
      time,
      singer,
      playTime: "",
    });
  });
  return list;
}

function parsePlaylists(html: string) {
  const doc = parseHtml(html);
  const list: Array<{ url: string; img: string; name: string }> = [];
  doc.querySelectorAll(".ilingku_list ul li").forEach((li) => {
    const a = li.querySelector(".pic a");
    const img = li.querySelector(".pic img")?.getAttribute("src") || "";
    const nameEl = li.querySelector(".name a");
    list.push({
      url: absUrl(a?.getAttribute("href")),
      img,
      name: attrOrText(nameEl),
    });
  });
  return list;
}

function parseSongList(html: string) {
  const doc = parseHtml(html);
  const list: Array<{ url: string; name: string }> = [];
  doc.querySelectorAll(".play_list ul li .name a").forEach((a) => {
    list.push({
      url: absUrl(a.getAttribute("href")),
      name: a.textContent?.trim() || "",
    });
  });
  return list;
}

type ItemType =
  | "home"
  | "rank"
  | "song"
  | "mv"
  | "singer"
  | "playlist"
  | "radio"
  | "list";

function detectItemType(href: string): ItemType | null {
  if (href.startsWith("/mp3/")) return "song";
  if (href.startsWith("/mp4/")) return "mv";
  if (href.startsWith("/singer/")) return "singer";
  if (href.startsWith("/playlist/")) return "playlist";
  if (href.startsWith("/radio/")) return "radio";
  return null;
}

function detectPageType(href: string): ItemType {
  if (href === "/") return "home";
  if (href.startsWith("/list/")) return "rank";
  if (href.startsWith("/singerlist/")) return "singer";
  if (href.startsWith("/playtype/")) return "playlist";
  if (href.startsWith("/radiolist/")) return "radio";
  if (href.startsWith("/mvlist/")) return "mv";
  const item = detectItemType(href);
  if (item) return item;
  return "list";
}

function parseNavCategories(html: string) {
  const doc = parseHtml(html);
  const list: Array<{ id: number; name: string; url: string; type: string }> =
    [];
  const seen = new Set<string>();
  doc.querySelectorAll(".nav ul li a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href) return;
    const name = a.textContent?.trim() || "";
    const url = absUrl(href);
    if (!name || seen.has(url)) return;
    seen.add(url);
    list.push({ id: list.length + 1, name, url, type: detectPageType(href) });
  });
  return list;
}

function parseGenericList(html: string) {
  const doc = parseHtml(html);
  const list: Array<{
    url: string;
    name: string;
    img: string;
    type: ItemType;
  }> = [];
  const seen = new Set<string>();
  doc.querySelectorAll("li").forEach((li) => {
    let a = li.querySelector(".name a[href]");
    if (!a) a = li.querySelector("a[href]");
    const href = a?.getAttribute("href") || "";
    const type = detectItemType(href);
    if (!type) return;
    const url = absUrl(href);
    if (seen.has(url)) return;
    seen.add(url);
    const name = attrOrText(a);
    const img = li.querySelector("img")?.getAttribute("src") || "";
    list.push({ url, name, img, type });
  });
  return list;
}

function parsePagination(html: string) {
  const doc = parseHtml(html);
  const page = doc.querySelector(".page");
  const result: {
    current: number;
    total: number;
    items: Array<{ label: string; url: string; current: boolean }>;
  } = {
    current: 1,
    total: 1,
    items: [],
  };
  if (!page) return result;

  page.querySelectorAll("a").forEach((a) => {
    const label = a.textContent?.trim() || "";
    const href = a.getAttribute("href");
    const isCurrent = a.classList.contains("current");
    if (isCurrent) result.current = Number(label) || 1;
    if (label === "尾页" && href) {
      const m = href.match(/\/(\d+)\.html/);
      if (m) result.total = Number(m[1]);
    }
    result.items.push({
      label,
      url: href ? absUrl(href) : "",
      current: isCurrent,
    });
  });
  return result;
}

function parseHotRankings(html: string) {
  const doc = parseHtml(html);
  const box = doc.querySelector(".ilingku_fl");
  const result: {
    title: string;
    list: Array<{ url: string; name: string; current: boolean }>;
  } = {
    title: "热门榜单",
    list: [],
  };
  if (!box) return result;

  const title = box.querySelector(".title h1")?.textContent?.trim();
  if (title) result.title = title;

  const seen = new Set<string>();
  box.querySelectorAll("li a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("/list/")) return;
    const url = absUrl(href);
    if (seen.has(url)) return;
    const name = attrOrText(a);
    if (!name) return;
    seen.add(url);
    result.list.push({ url, name, current: a.classList.contains("current") });
  });
  return result;
}

function parseSearchResult(html: string) {
  const doc = parseHtml(html);
  const list: Array<{ url: string; name: string }> = [];
  doc.querySelectorAll(".play_list ul li .name a").forEach((a) => {
    list.push({
      url: absUrl(a.getAttribute("href")),
      name: a.textContent?.trim() || "",
    });
  });
  const heading =
    doc.querySelector(".play_list .title h1")?.textContent?.trim() || "";
  const totalText =
    doc.querySelector(".play_list .pagedata span")?.textContent?.trim() || "";
  const total = Number(totalText) || 0;
  return { list, heading, total };
}

// 歌曲播放信息：POST /js/play.php
async function fetchSongPlayInfo(songPageUrl: string) {
  const url = songPageUrl.startsWith("http") ? songPageUrl : BASE + songPageUrl;
  const path = new URL(url).pathname;
  const id = path.match(/\/(?:mp3|mp4)\/([^/.]+)\.html/)?.[1];
  if (!id) throw new Error("无法从链接中解析歌曲 id: " + songPageUrl);

  await ensureVerified();
  const text = await httpRequest(BASE + "/js/play.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: `id=${encodeURIComponent(id)}&type=music`,
    referer: url,
  });
  return JSON.parse(text) as {
    lkid?: number;
    title?: string;
    pic?: string;
    url?: string;
  };
}

// 歌词接口
async function fetchLyric(songPageUrl: string) {
  const info = await fetchSongPlayInfo(songPageUrl);
  if (!info.lkid) return { lrc: "" };
  const text = await httpRequest(
    `https://js.eev3.com/lrc.php?cid=${info.lkid}`,
  );
  try {
    const data = JSON.parse(text) as { lrc?: string };
    return { lrc: data.lrc || "" };
  } catch {
    return { lrc: "" };
  }
}

// ---------------------------------------------------------------------------
// 对外导出
// ---------------------------------------------------------------------------
export const scraper = {
  fetchHome: () => fetchPage("/"),
  parseSingers: async () => parseSingers(await fetchPage("/")),
  parseListeningSongs: async () => parseListeningSongs(await fetchPage("/")),
  parsePlaylists: async () => parsePlaylists(await fetchPage("/")),
  parseSongListByUrl: async (url: string) =>
    parseSongList(await fetchPage(url)),
  parseNavCategories: async () => parseNavCategories(await fetchPage("/")),
  parseHotRankings: async () =>
    parseHotRankings(await fetchPage("/list/new.html")),
  parseGenericList: async (url: string) => {
    const html = await fetchPage(url);
    return { list: parseGenericList(html), pagination: parsePagination(html) };
  },
  parseSearch: async (wd: string, page = 1) => {
    const path =
      page > 1
        ? `/so/${encodeURIComponent(wd)}/${page}.html`
        : `/so/${encodeURIComponent(wd)}.html`;
    const html = await fetchPage(path);
    return {
      keyword: wd,
      ...parseSearchResult(html),
      pagination: parsePagination(html),
    };
  },
  getSongPlayInfo: fetchSongPlayInfo,
  getLyric: fetchLyric,
};
