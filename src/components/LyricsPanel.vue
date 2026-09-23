<script setup lang="ts">
import { computed, inject, nextTick, ref, watch, type Ref } from 'vue'
import { NIcon } from 'naive-ui'
import { CloseOutline, MusicalNotesOutline } from '@vicons/ionicons5'

interface LyricLine {
    time: number
    text: string
}

interface SongLike {
    title: string
    artist: string
}

// 注入全局状态
const currentLyric = inject<Ref<string>>('currentLyric', ref(''))
const currentTime = inject<Ref<number>>('currentTime', ref(0))
const currentSong = inject<Ref<SongLike | null>>('currentSong', ref(null))
const playerVisible = inject<Ref<boolean>>('playerVisible', ref(true))

const isOpen = ref(false)
const listEl = ref<HTMLElement | null>(null)

// 解析 LRC 文本为按时间升序的行列表
const lines = computed<LyricLine[]>(() => {
    const raw = currentLyric.value || ''
    if (!raw) return []
    const result: LyricLine[] = []
    for (const row of raw.split('\n')) {
        const text = row.replace(/\[[^\]]*\]/g, '').trim()
        if (!text) continue
        const timeRegex = /\[(\d+):(\d+(?:\.\d+)?)\]/g
        let m: RegExpExecArray | null
        while ((m = timeRegex.exec(row)) !== null) {
            result.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text })
        }
    }
    return result.sort((a, b) => a.time - b.time)
})

// 当前高亮行索引
const activeIndex = computed(() => {
    const t = currentTime.value
    let idx = -1
    for (let i = 0; i < lines.value.length; i++) {
        if (lines.value[i].time <= t + 0.3) idx = i
        else break
    }
    return idx
})

// 高亮行变化时滚动到视图中间
watch(activeIndex, async (idx) => {
    if (!isOpen.value || idx < 0) return
    await nextTick()
    const container = listEl.value
    const el = container?.children[idx] as HTMLElement | undefined
    if (container && el) {
        container.scrollTo({
            top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
            behavior: 'smooth',
        })
    }
})

// 切歌时重置滚动位置
watch(currentLyric, () => {
    if (listEl.value) listEl.value.scrollTop = 0
})

function toggle() {
    isOpen.value = !isOpen.value
}
</script>

<template>
    <div class="lyrics-panel" :class="{ 'lyrics-panel--shifted': !playerVisible && currentSong }">
        <!-- 歌词面板 -->
        <div v-show="isOpen" class="lyrics-body">
            <div class="lyrics-header">
                <div class="lyrics-title">{{ currentSong?.title || '暂无歌曲' }}</div>
                <div class="lyrics-artist">{{ currentSong?.artist }}</div>
            </div>
            <div v-if="lines.length" ref="listEl" class="lyrics-list">
                <p v-for="(line, idx) in lines" :key="idx" class="lyrics-line"
                    :class="{ 'lyrics-line--active': idx === activeIndex }">
                    {{ line.text }}
                </p>
            </div>
            <div v-else class="lyrics-empty">暂无歌词</div>
        </div>

        <!-- 触发按钮 -->
        <button class="lyrics-trigger" type="button" :aria-label="isOpen ? '收起歌词' : '展开歌词'" @click="toggle">
            <n-icon size="18">
                <component :is="isOpen ? CloseOutline : MusicalNotesOutline" />
            </n-icon>
            <span>歌词</span>
        </button>
    </div>
</template>

<style scoped>
.lyrics-panel {
    position: fixed;
    right: 16px;
    /* 位于固定分页上方，避免重叠 */
    bottom: 154px;
    z-index: 90;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    transition: bottom 0.24s ease;
}

/* 播放条隐藏时分页上移，歌词面板同步上移 */
.lyrics-panel--shifted {
    bottom: 105px;
}

.lyrics-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    color: #4b5563;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(31, 45, 61, 0.1);
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.lyrics-trigger:hover {
    color: #1890ff;
    background: #f2f8ff;
    transform: translateY(-1px);
}

.lyrics-trigger:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
}

.lyrics-body {
    width: min(360px, calc(100vw - 32px));
    max-height: 60vh;
    margin-bottom: 10px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 12px 36px rgba(31, 45, 61, 0.16);
    display: flex;
    flex-direction: column;
}

.lyrics-header {
    flex-shrink: 0;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.lyrics-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.lyrics-artist {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
}

.lyrics-list {
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
    text-align: center;
}

.lyrics-line {
    margin: 0;
    padding: 7px 4px;
    font-size: 14px;
    line-height: 1.5;
    color: #6b7280;
    transition: color 0.2s ease, transform 0.2s ease, font-weight 0.2s ease;
}

.lyrics-line--active {
    color: #1890ff;
    font-weight: 600;
    transform: scale(1.04);
}

.lyrics-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    color: #9ca3af;
    font-size: 14px;
}

@media (prefers-reduced-motion: reduce) {

    .lyrics-panel,
    .lyrics-trigger,
    .lyrics-line,
    .lyrics-list {
        transition: none;
        scroll-behavior: auto;
    }

    .lyrics-line--active {
        transform: none;
    }
}
</style>
