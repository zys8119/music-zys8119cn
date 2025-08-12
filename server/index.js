const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const musicScraper = require('./scrapers/musicScraper');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: '音乐数据抓取服务器运行中',
    version: '1.0.0',
    endpoints: {
      '/api/music/search': 'GET - 搜索音乐',
      '/api/music/hot': 'GET - 获取热门音乐',
      '/api/music/categories': 'GET - 获取音乐分类',
      '/api/scrape/test': 'GET - 测试抓取功能'
    }
  });
});

// 音乐相关API路由
app.get('/api/music/search', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请提供搜索关键词'
      });
    }

    // 这里暂时返回示例数据，实际抓取功能待实现
    const mockData = {
      success: true,
      data: {
        total: 100,
        page: parseInt(page),
        limit: parseInt(limit),
        songs: [
          {
            id: 1,
            title: `${keyword} - 示例歌曲1`,
            artist: '示例歌手1',
            album: '示例专辑1',
            duration: '03:45',
            url: 'https://example.com/song1.mp3',
            cover: 'https://example.com/cover1.jpg'
          },
          {
            id: 2,
            title: `${keyword} - 示例歌曲2`,
            artist: '示例歌手2',
            album: '示例专辑2',
            duration: '04:12',
            url: 'https://example.com/song2.mp3',
            cover: 'https://example.com/cover2.jpg'
          }
        ]
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('搜索音乐错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取热门音乐
app.get('/api/music/hot', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    // 示例热门音乐数据
    const mockData = {
      success: true,
      data: {
        total: 200,
        page: parseInt(page),
        limit: parseInt(limit),
        songs: [
          {
            id: 101,
            title: '热门歌曲1',
            artist: '热门歌手1',
            album: '热门专辑1',
            duration: '03:30',
            playCount: 1000000,
            url: 'https://example.com/hot1.mp3',
            cover: 'https://example.com/hot_cover1.jpg'
          },
          {
            id: 102,
            title: '热门歌曲2',
            artist: '热门歌手2',
            album: '热门专辑2',
            duration: '04:05',
            playCount: 850000,
            url: 'https://example.com/hot2.mp3',
            cover: 'https://example.com/hot_cover2.jpg'
          }
        ]
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('获取热门音乐错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取音乐分类
app.get('/api/music/categories', async (req, res) => {
  try {
    const mockData = {
      success: true,
      data: {
        categories: [
          { id: 1, name: '流行', count: 5000 },
          { id: 2, name: '摇滚', count: 3200 },
          { id: 3, name: '电子', count: 2800 },
          { id: 4, name: '古典', count: 1500 },
          { id: 5, name: '爵士', count: 1200 },
          { id: 6, name: '民谣', count: 2000 }
        ]
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('获取音乐分类错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 测试抓取功能
app.get('/api/scrape/test', async (req, res) => {
  try {
    // 这里调用实际的抓取模块进行测试
    const result = await musicScraper.testScraping();
    res.json({
      success: true,
      message: '抓取测试完成',
      data: result
    });
  } catch (error) {
    console.error('抓取测试错误:', error);
    res.status(500).json({
      success: false,
      message: '抓取测试失败',
      error: error.message
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 音乐抓取服务器启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📚 API文档: http://localhost:${PORT}`);
});

module.exports = app;