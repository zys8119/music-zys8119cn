# 音乐数据抓取服务器

一个用于抓取音乐网站数据的 Node.js 服务器，支持搜索、热门音乐获取等功能。

## 功能特性

- 🎵 音乐搜索功能
- 🔥 热门音乐获取
- 📂 音乐分类管理
- 🕷️ 网页数据抓取
- 🚀 RESTful API 接口
- 📊 示例数据生成

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **Axios** - HTTP 请求库
- **Cheerio** - 服务端 jQuery 实现
- **Puppeteer** - 浏览器自动化
- **CORS** - 跨域支持

## 安装和运行

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 环境配置

复制环境配置文件：
```bash
cp .env.example .env
```

根据需要修改 `.env` 文件中的配置。

### 3. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3001` 启动。

## API 接口

### 基础信息

```
GET /
```

返回服务器基本信息和可用接口列表。

### 音乐搜索

```
GET /api/music/search?keyword={关键词}&page={页码}&limit={每页数量}
```

**参数：**
- `keyword` (必需): 搜索关键词
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 20

**响应示例：**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "songs": [
      {
        "id": 1,
        "title": "歌曲名称",
        "artist": "歌手名称",
        "album": "专辑名称",
        "duration": "03:45",
        "url": "播放链接",
        "cover": "封面图片链接"
      }
    ]
  }
}
```

### 热门音乐

```
GET /api/music/hot?page={页码}&limit={每页数量}
```

**参数：**
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 50

### 音乐分类

```
GET /api/music/categories
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "流行",
        "count": 5000
      }
    ]
  }
}
```

### 抓取测试

```
GET /api/scrape/test
```

测试抓取功能是否正常工作。

## 项目结构

```
server/
├── index.js                 # 主服务器文件
├── package.json             # 项目配置
├── .env.example             # 环境变量示例
├── README.md                # 项目文档
└── scrapers/
    └── musicScraper.js      # 音乐抓取模块
```

## 开发说明

### 抓取模块

`scrapers/musicScraper.js` 包含了所有抓取相关的逻辑：

- **testScraping()** - 测试抓取功能
- **searchMusic()** - 搜索音乐
- **getHotMusic()** - 获取热门音乐
- **getCategories()** - 获取分类
- **parseMusicDetail()** - 解析音乐详情

### 抓取方法

项目支持两种抓取方法：

1. **Axios + Cheerio** - 轻量级，适合静态内容
2. **Puppeteer** - 重量级，适合动态内容和 JavaScript 渲染

### 注意事项

⚠️ **重要提醒：**

1. 本项目仅用于学习和研究目的
2. 请遵守目标网站的 robots.txt 和使用条款
3. 建议添加适当的请求延迟，避免对目标服务器造成压力
4. 生产环境使用前请确保符合相关法律法规

### 扩展功能

可以根据需要添加以下功能：

- 数据库存储
- 缓存机制
- 用户认证
- 请求限流
- 日志记录
- 错误监控

## 许可证

MIT License