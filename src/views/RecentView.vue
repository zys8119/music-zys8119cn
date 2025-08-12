<script setup lang="ts">
import { ref } from 'vue'
import { NEmpty, NCard } from 'naive-ui'
</script>

<template>
  <div class="recent-view">
    <h1>最近播放</h1>
    <n-card class="content-card">
      <n-empty description="暂无最近播放记录">
        <template #extra>
          <span>播放歌曲后，将会在这里显示您最近播放的歌曲</span>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<style scoped>
.recent-view {
  padding: 20px;
}

.content-card {
  margin-top: 20px;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>