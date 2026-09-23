import express from "express";
import type { Request, Response } from "express";
import * as cheerio from "cheerio";

// 目标音乐站点
const BASE = "https://www.22a5.com";
const PORT = Number(process.env.PORT) || 4444;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// ---------------------------------------------------------------------------
// 会话管理：目标站点有“安全人机验证”，需要先 GET 首页拿到 csrf_token 与 PHPSESSID，
// 再 POST 勾选“我不是人机”完成验证，之后 1 小时内可正常抓取。
// ---------------------------------------------------------------------------
let cookieJar = "";
let verifiedAt = 0;
const VERIFY_TTL = 55 * 60 * 1000; // 预留余量，55 分钟后重新验证

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

function getSetCookies(res: globalThis.Response): string[] {
  const anyHeaders = res.headers as unknown as {
    getSetCookie?: () => string[];
  };
  if (typeof anyHeaders.getSetCookie === "function")
    return anyHeaders.getSetCookie();
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
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

async function ensureVerified(force = false) {
  if (!force && cookieJar && Date.now() - verifiedAt < VERIFY_TTL) return;

  // 1. 获取首页，提取 csrf_token
  const homeRes = await fetch(BASE + "/", {
    headers: baseHeaders(),
    redirect: "manual",
  });
  mergeCookies(getSetCookies(homeRes));
  const homeHtml = await homeRes.text();
  const token = homeHtml.match(/name="csrf_token"\s+value="([^"]+)"/)?.[1];

  // 2. 提交人机验证
  if (token) {
    const verifyRes = await fetch(BASE + "/", {
      method: "POST",
      headers: baseHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: BASE,
      }),
      body: `csrf_token=${encodeURIComponent(token)}&human_check=on`,
      redirect: "manual",
    });
    mergeCookies(getSetCookies(verifyRes));
  }
  verifiedAt = Date.now();
}

// 抓取页面 HTML（自动确保已完成人机验证）
async function fetchPage(target: string): Promise<string> {
  await ensureVerified();
  const url = target.startsWith("http") ? target : BASE + target;
  let res = await fetch(url, { headers: baseHeaders({ Referer: BASE + "/" }) });
  let html = await res.text();

  // 会话失效时页面会再次出现验证框，此时强制重新验证并重试一次
  if (html.includes("安全人机验证") || html.includes("我不是人机")) {
    await ensureVerified(true);
    res = await fetch(url, { headers: baseHeaders({ Referer: BASE + "/" }) });
    html = await res.text();
  }
  return html;
}

// 解析相对链接为绝对链接
function absUrl(href?: string | null): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return BASE + (href.startsWith("/") ? href : "/" + href);
}

// ---------------------------------------------------------------------------
// 解析函数
// ---------------------------------------------------------------------------

// 推荐歌手：.lksinger_list ul li
function parseSingers(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{ url: string; img: string; name: string }> = [];
  $(".lksinger_list ul li").each((_, li) => {
    const $li = $(li);
    const a = $li.find(".pic a").first();
    const img = $li.find(".pic img").attr("src") || "";
    const name =
      $li.find(".name a").attr("title") || $li.find(".name a").text().trim();
    list.push({ url: absUrl(a.attr("href")), img, name });
  });
  return list;
}

// 网友都在听：.lkmusic_list ul li
function parseListeningSongs(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{
    url: string;
    img: string;
    music: string;
    time: string;
    singer: string;
    playTime: string;
  }> = [];
  $(".lkmusic_list ul li").each((_, li) => {
    const $li = $(li);
    const a = $li.find(".list_r .name a.url").first();
    const img = $li.find(".pic img").attr("src") || "";
    const music = a.attr("title") || a.text().trim();
    const time = $li.find(".list_r .name .time").text().trim();
    const singer = $li.find(".list_r p a.singer").text().trim();
    list.push({
      url: absUrl(a.attr("href")),
      img,
      music,
      time,
      singer,
      playTime: "",
    });
  });
  return list;
}

// 热门歌单：.ilingku_list ul li
function parsePlaylists(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{ url: string; img: string; name: string }> = [];
  $(".ilingku_list ul li").each((_, li) => {
    const $li = $(li);
    const a = $li.find(".pic a").first();
    const img = $li.find(".pic img").attr("src") || "";
    const name =
      $li.find(".name a").attr("title") || $li.find(".name a").text().trim();
    list.push({ url: absUrl(a.attr("href")), img, name });
  });
  return list;
}

// 榜单/歌单歌曲列表：.play_list ul li .name a
function parseSongList(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{ url: string; name: string }> = [];
  $(".play_list ul li .name a").each((_, a) => {
    const $a = $(a);
    list.push({ url: absUrl($a.attr("href")), name: $a.text().trim() });
  });
  return list;
}

// 导航分类：解析目标站点顶部导航（首页/新歌榜/TOP榜单/DJ舞曲/歌手/歌单/电台/高清MV）
function parseNavCategories(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{ id: number; name: string; url: string; type: string }> =
    [];
  const seen = new Set<string>();
  $(".nav ul li a").each((_, a) => {
    const href = $(a).attr("href") || "";
    if (!href) return;
    const name = $(a).text().trim();
    const url = absUrl(href);
    if (!name || seen.has(url)) return;
    seen.add(url);
    list.push({ id: list.length + 1, name, url, type: detectPageType(href) });
  });
  return list;
}

// 根据链接判断条目/页面类型
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

// 判断导航项对应的页面类型
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

// 通用列表解析：适配榜单/歌手/歌单/电台/MV 等页面
function parseGenericList(html: string) {
  const $ = cheerio.load(html);
  const list: Array<{
    url: string;
    name: string;
    img: string;
    type: ItemType;
  }> = [];
  const seen = new Set<string>();
  $("li").each((_, li) => {
    const $li = $(li);
    let $a = $li.find(".name a[href]").first();
    if (!$a.length) $a = $li.find("a[href]").first();
    const href = $a.attr("href") || "";
    const type = detectItemType(href);
    if (!type) return;
    const url = absUrl(href);
    if (seen.has(url)) return;
    seen.add(url);
    const name = ($a.attr("title") || $a.text()).trim();
    const img = $li.find("img").attr("src") || "";
    list.push({ url, name, img, type });
  });
  return list;
}

// 解析分页信息：完全参考站点结构
// <div class="page"><a class="current">1</a><a href="/list/top/2.html">2</a><a href="...">下一页</a><a href="...">尾页</a></div>
function parsePagination(html: string) {
  const $ = cheerio.load(html);
  const $page = $(".page").first();
  const result: {
    current: number;
    total: number;
    items: Array<{ label: string; url: string; current: boolean }>;
  } = { current: 1, total: 1, items: [] };
  if (!$page.length) return result;

  $page.find("a").each((_, a) => {
    const $a = $(a);
    const label = $a.text().trim();
    const href = $a.attr("href");
    const isCurrent = $a.hasClass("current");
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

// 从歌曲详情页调用 /js/play.php 获取真实播放地址
async function fetchSongPlayInfo(songPageUrl: string) {
  const url = songPageUrl.startsWith("http") ? songPageUrl : BASE + songPageUrl;
  const path = new URL(url).pathname;
  const id = path.match(/\/(?:mp3|mp4)\/([^/.]+)\.html/)?.[1];
  if (!id) throw new Error("无法从链接中解析歌曲 id: " + songPageUrl);

  await ensureVerified();
  const res = await fetch(BASE + "/js/play.php", {
    method: "POST",
    headers: baseHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Referer: url,
    }),
    // MV 与音乐统一使用 music 类型即可返回可播放地址
    body: `id=${encodeURIComponent(id)}&type=music`,
  });
  const text = await res.text();
  const data = JSON.parse(text) as {
    title?: string;
    pic?: string;
    url?: string;
  };
  return data;
}

// ---------------------------------------------------------------------------
// Express 服务
// ---------------------------------------------------------------------------
const app = express();

// CORS：允许前端开发/生产环境跨域访问
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.options(/.*/, (_req, res) => res.sendStatus(204));

const ok = (res: Response, data: unknown) => res.json({ code: 200, data });
const fail = (res: Response, message: string) =>
  res.status(500).json({ code: 500, message, data: null });

// 推荐歌手
app.get("/music/recommended-singer", async (_req: Request, res: Response) => {
  try {
    ok(res, parseSingers(await fetchPage("/")));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 网友都在听
app.get(
  "/music/netizensAreAllListening",
  async (_req: Request, res: Response) => {
    try {
      ok(res, parseListeningSongs(await fetchPage("/")));
    } catch (e) {
      fail(res, (e as Error).message);
    }
  },
);

// 热门歌单
app.get("/music/hotPlayList", async (_req: Request, res: Response) => {
  try {
    ok(res, parsePlaylists(await fetchPage("/")));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 歌曲飙升榜（取 TOP 榜单页）
app.get("/music/songRising", async (_req: Request, res: Response) => {
  try {
    ok(res, parseSongList(await fetchPage("/list/top.html")));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 导航分类（真实站点导航）
app.get("/music/categories", async (_req: Request, res: Response) => {
  try {
    ok(res, parseNavCategories(await fetchPage("/")));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 热门榜单分类（兼容旧接口，仅返回榜单类入口）
app.get("/music/hotList", async (_req: Request, res: Response) => {
  try {
    const all = parseNavCategories(await fetchPage("/"));
    ok(
      res,
      all.filter((c) => c.type === "rank"),
    );
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 通用列表：根据页面 URL 解析榜单/歌手/歌单/电台/MV 等列表
app.get("/music/getList", async (req: Request, res: Response) => {
  const url = String(req.query.url || "");
  if (!url) return fail(res, "缺少 url 参数");
  try {
    const html = await fetchPage(url);
    ok(res, {
      list: parseGenericList(html),
      pagination: parsePagination(html),
    });
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 根据 URL 获取榜单/歌单歌曲列表
app.get("/music/getHotPlayList", async (req: Request, res: Response) => {
  const url = String(req.query.url || "");
  if (!url) return fail(res, "缺少 url 参数");
  try {
    ok(res, parseSongList(await fetchPage(url)));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

// 根据 URL 获取歌曲播放信息
app.get("/music/get", async (req: Request, res: Response) => {
  const url = String(req.query.url || "");
  if (!url) return fail(res, "缺少 url 参数");
  try {
    ok(res, await fetchSongPlayInfo(url));
  } catch (e) {
    fail(res, (e as Error).message);
  }
});

app.listen(PORT, () => {
  console.log(`HTTP 服务已启动: http://127.0.0.1:${PORT}`);
});
