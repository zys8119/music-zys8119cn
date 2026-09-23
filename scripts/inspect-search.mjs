// 临时脚本：定位 CheckPost 定义并对比 curl
const BASE = "https://www.22a5.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let cookieJar = "";
function mergeCookies(setCookies) {
  const jar = new Map();
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
function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function")
    return res.headers.getSetCookie();
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}
function baseHeaders(extra = {}) {
  const headers = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
    Referer: BASE + "/",
    ...extra,
  };
  if (cookieJar) headers.Cookie = cookieJar;
  return headers;
}

await fetch(BASE + "/", { headers: baseHeaders(), redirect: "manual" }).then(
  async (r) => {
    mergeCookies(getSetCookies(r));
    const html = await r.text();
    const token = html.match(/name="csrf_token"\s+value="([^"]+)"/)?.[1];
    if (token) {
      const vr = await fetch(BASE + "/", {
        method: "POST",
        headers: baseHeaders({
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: BASE,
        }),
        body: `csrf_token=${encodeURIComponent(token)}&human_check=on`,
        redirect: "manual",
      });
      mergeCookies(getSetCookies(vr));
    }
  },
);
await sleep(500);

const homeHtml = await (
  await fetch(BASE + "/", { headers: baseHeaders() })
).text();

// 宽松查找 CheckPost
const idx = homeHtml.indexOf("CheckPost");
console.log("CheckPost idx", idx);
if (idx >= 0) {
  console.log("=== around CheckPost (all occurrences) ===");
  let from = 0;
  let n = 0;
  while (n < 5) {
    const i = homeHtml.indexOf("CheckPost", from);
    if (i < 0) break;
    console.log("---occurrence", n, "---");
    console.log(homeHtml.slice(Math.max(0, i - 400), i + 200));
    from = i + 9;
    n++;
  }
}

console.log("\nCookieJar:", cookieJar);
