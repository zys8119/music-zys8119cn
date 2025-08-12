<script setup lang="ts">
// 首页组件
</script>

<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="hero-title">欢迎来到音乐播放器</h1>
      <p class="hero-subtitle">发现你喜欢的音乐，享受美妙的音乐时光</p>
    </div>
    
    <div class="features-section">
      <div class="feature-card">
        <n-icon size="48" color="#1890ff">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55c-2.21 0-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4V7h4V3h-6z"/></svg>
        </n-icon>
        <h3>海量音乐</h3>
        <p>数百万首高品质音乐等你发现</p>
      </div>
      
      <div class="feature-card">
        <n-icon size="48" color="#52c41a">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </n-icon>
        <h3>个性推荐</h3>
        <p>基于你的喜好推荐最适合的音乐</p>
      </div>
      
      <div class="feature-card">
        <n-icon size="48" color="#fa541c">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </n-icon>
        <h3>收藏管理</h3>
        <p>轻松管理你的音乐收藏和播放列表</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  padding: 40px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
  padding: 60px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 16px 0 12px;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  margin: 0;
}
</style>