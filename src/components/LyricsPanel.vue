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
const seekTo = inject<(t: number) => void>('seekTo', () => { })

const isOpen = ref(false)
const listEl = ref<HTMLElement | null>(null)
// 面板根元素（用于拖动定位）
const panelEl = ref<HTMLElement | null>(null)

// 用户手动滚动/拖拽时暂停自动滚动，避免冲突
const userScrollLock = ref(false)
let scrollIdleTimer: number | null = null

// 鼠标拖拽滚动状态
const isDragging = ref(false)
let dragStartY = 0
let dragStartScrollTop = 0
// 本次按住是否发生位移（用于区分拖拽与点击）
let dragMoved = false

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

// 当前激活歌词文本（用于在触发按钮上实时展示）
const activeLineText = computed(() => {
    const idx = activeIndex.value
    if (idx < 0) return ''
    return lines.value[idx]?.text || ''
})

// 将指定行滚动到容器中间
function scrollToLine(idx: number) {
    const container = listEl.value
    const el = container?.children[idx] as HTMLElement | undefined
    if (!container || !el) return
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const elCenter = elRect.top - containerRect.top + container.scrollTop + elRect.height / 2
    container.scrollTo({
        top: elCenter - container.clientHeight / 2,
        behavior: 'smooth',
    })
}

// 用户手动滚动：暂停自动滚动，停止后重新居中当前激活行
function pauseAutoScroll() {
    userScrollLock.value = true
    if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
    scrollIdleTimer = window.setTimeout(() => {
        userScrollLock.value = false
        if (isOpen.value && activeIndex.value >= 0) scrollToLine(activeIndex.value)
    }, 1200)
}

// 鼠标离开歌词区域：立即将当前激活行重新居中
function onListLeave() {
    if (isDragging.value) return
    if (scrollIdleTimer !== null) {
        clearTimeout(scrollIdleTimer)
        scrollIdleTimer = null
    }
    userScrollLock.value = false
    if (isOpen.value && activeIndex.value >= 0) scrollToLine(activeIndex.value)
}

// ===== 鼠标拖拽滚动 =====
function onDragStart(e: MouseEvent) {
    const container = listEl.value
    if (!container || e.button !== 0) return
    isDragging.value = true
    dragMoved = false
    dragStartY = e.clientY
    dragStartScrollTop = container.scrollTop
    userScrollLock.value = true
    if (scrollIdleTimer !== null) {
        clearTimeout(scrollIdleTimer)
        scrollIdleTimer = null
    }
    container.style.scrollBehavior = 'auto'
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
    const container = listEl.value
    if (!container || !isDragging.value) return
    const delta = e.clientY - dragStartY
    if (Math.abs(delta) > 3) dragMoved = true
    container.scrollTop = dragStartScrollTop - delta
    e.preventDefault()
}

function onDragEnd() {
    const container = listEl.value
    isDragging.value = false
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    if (container) container.style.scrollBehavior = ''
    if (dragMoved) pauseAutoScroll()
    setTimeout(() => {
        dragMoved = false
    }, 0)
}

// 点击歌词跳转到对应进度（拖拽结束后的 click 不触发）
function seekToLine(line: LyricLine) {
    if (dragMoved) return
    seekTo(line.time)
    userScrollLock.value = false
    if (scrollIdleTimer !== null) {
        clearTimeout(scrollIdleTimer)
        scrollIdleTimer = null
    }
}

// 高亮行变化时滚动到视图中间（用户手动滚动期间不打扰）
watch(activeIndex, async (idx) => {
    if (!isOpen.value || idx < 0 || userScrollLock.value) return
    await nextTick()
    scrollToLine(idx)
})

// 展开面板时定位到当前行，并计算展开方向
watch(isOpen, async (open) => {
    if (!open) {
        bodyBelow.value = false
        return
    }
    await nextTick()
    updateBodyPlacement()
    if (activeIndex.value >= 0) scrollToLine(activeIndex.value)
})

// 切歌时重置滚动位置
watch(currentLyric, () => {
    if (listEl.value) listEl.value.scrollTop = 0
})

// ===== 面板位置拖动 =====
// 拖动后的自定义位置；null 表示沿用默认定位（right/bottom，随播放条联动）
const pos = ref<{ left: number; top: number; width: number } | null>(null)
const panelStyle = computed(() => {
    if (!pos.value) return undefined
    return {
        left: `${pos.value.left}px`,
        top: `${pos.value.top}px`,
        width: `${pos.value.width}px`,
        right: 'auto',
        bottom: 'auto',
    }
})

// 面板内容元素与展开方向：面板脱离文档流，避免撑开容器把按钮挤下去
const bodyEl = ref<HTMLElement | null>(null)
// 按钮上方空间不足时，面板改为在按钮下方展开
const bodyBelow = ref(false)

async function updateBodyPlacement() {
    if (!isOpen.value) {
        bodyBelow.value = false
        return
    }
    await nextTick()
    const panelRect = panelEl.value?.getBoundingClientRect()
    const bodyHeight = bodyEl.value?.offsetHeight ?? 0
    if (!panelRect) return
    // 预留 12px 间距，上方放不下则改为向下展开
    bodyBelow.value = panelRect.top < bodyHeight + 12
}

const isPanelDragging = ref(false)
let panelStartX = 0
let panelStartY = 0
let panelStartLeft = 0
let panelStartTop = 0
let panelStartWidth = 0
let panelStartHeight = 0
// 本次拖动是否发生了位移（用于区分拖动与点击）
let panelDragMoved = false

function onPanelPointerDown(e: PointerEvent) {
    // 仅响应鼠标左键 / 触摸
    if (e.button !== 0) return
    const el = panelEl.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    isPanelDragging.value = true
    panelDragMoved = false
    panelStartX = e.clientX
    panelStartY = e.clientY
    panelStartLeft = rect.left
    panelStartTop = rect.top
    panelStartWidth = rect.width
    panelStartHeight = rect.height
    window.addEventListener('pointermove', onPanelPointerMove)
    window.addEventListener('pointerup', onPanelPointerUp)
    window.addEventListener('pointercancel', onPanelPointerUp)
}

function onPanelPointerMove(e: PointerEvent) {
    if (!isPanelDragging.value) return
    const dx = e.clientX - panelStartX
    const dy = e.clientY - panelStartY
    // 超过阈值才视为拖动，避免轻微抖动误触发
    if (!panelDragMoved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    panelDragMoved = true
    // 限制在视口内，避免拖出屏幕
    const left = Math.min(Math.max(panelStartLeft + dx, 0), Math.max(0, window.innerWidth - panelStartWidth))
    const top = Math.min(Math.max(panelStartTop + dy, 0), Math.max(0, window.innerHeight - panelStartHeight))
    pos.value = { left, top, width: panelStartWidth }
    e.preventDefault()
}

function onPanelPointerUp() {
    isPanelDragging.value = false
    window.removeEventListener('pointermove', onPanelPointerMove)
    window.removeEventListener('pointerup', onPanelPointerUp)
    window.removeEventListener('pointercancel', onPanelPointerUp)
    // 拖动结束后按新位置重新判断展开方向
    updateBodyPlacement()
    // 下一帧再重置，避免拖动结束后的 click 触发展开/收起
    setTimeout(() => {
        panelDragMoved = false
    }, 0)
}

function toggle() {
    // 拖动后不触发展开/收起
    if (panelDragMoved) return
    isOpen.value = !isOpen.value
}

onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    window.removeEventListener('pointermove', onPanelPointerMove)
    window.removeEventListener('pointerup', onPanelPointerUp)
    window.removeEventListener('pointercancel', onPanelPointerUp)
    if (scrollIdleTimer !== null) clearTimeout(scrollIdleTimer)
})
</script>

<template>
    <div ref="panelEl" class="lyrics-panel"
        :class="{ 'lyrics-panel--shifted': !pos && !playerVisible && currentSong, 'lyrics-panel--dragging': isPanelDragging, 'lyrics-panel--below': bodyBelow }"
        :style="panelStyle">
        <!-- 歌词面板：绝对定位，避免撑开容器把触发按钮挤走 -->
        <div v-show="isOpen" ref="bodyEl" class="lyrics-body">
            <!-- 面板头部：同样支持拖动移动面板 -->
            <div class="lyrics-header" @pointerdown="onPanelPointerDown">
                <div class="lyrics-title">{{ currentSong?.title || '暂无歌曲' }}</div>
                <div class="lyrics-artist">{{ currentSong?.artist }}</div>
            </div>
            <div v-if="lines.length" ref="listEl" class="lyrics-list" :class="{ 'lyrics-list--dragging': isDragging }"
                @wheel="pauseAutoScroll" @touchmove="pauseAutoScroll" @mouseleave="onListLeave"
                @mousedown="onDragStart">
                <p v-for="(line, idx) in lines" :key="idx" class="lyrics-line"
                    :class="{ 'lyrics-line--active': idx === activeIndex }" @click="seekToLine(line)">
                    {{ line.text }}
                </p>
            </div>
            <div v-else class="lyrics-empty">暂无歌词</div>
        </div>

        <!-- 触发按钮 -->
        <button class="lyrics-trigger" type="button" :aria-label="isOpen ? '收起歌词' : '展开歌词'"
            @pointerdown="onPanelPointerDown" @click="toggle">
            <span class="lyrics-trigger__now" :class="{ 'lyrics-trigger__now--empty': !activeLineText }">
                <template v-if="activeLineText">{{ activeLineText }}</template>
                <template v-else>歌词</template>
            </span>
            <n-icon size="18" class="lyrics-trigger__icon">
                <component :is="isOpen ? CloseOutline : MusicalNotesOutline" />
            </n-icon>
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

/* 拖动中：禁用过渡并提升层级，避免拖拽卡顿与被遮挡 */
.lyrics-panel--dragging {
    z-index: 1000;
    transition: none;
}

.lyrics-panel--dragging .lyrics-trigger {
    cursor: grabbing;
}

/* 播放条隐藏时分页上移，歌词面板同步上移 */
.lyrics-panel--shifted {
    bottom: 105px;
}

.lyrics-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: min(320px, calc(100vw - 32px));
    padding: 8px 14px;
    border: 1px solid var(--app-border);
    border-radius: 999px;
    background: var(--app-surface);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    color: var(--app-text);
    font-size: 13px;
    font-weight: 500;
    /* 允许在按钮上拖动面板，同时保留点击切换 */
    cursor: grab;
    touch-action: none;
    box-shadow: 0 4px 14px rgba(31, 45, 61, 0.1);
    transition: color 0.2s ease, background-color 0.3s ease, transform 0.2s ease,
        border-color 0.3s ease, box-shadow 0.2s ease;
}

/* 实时展示的当前激活歌词 */
.lyrics-trigger__now {
    min-width: 0;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1890ff;
    font-weight: 600;
    transition: color 0.25s ease, opacity 0.25s ease;
}

/* 暂无歌词时回退为普通标签样式 */
.lyrics-trigger__now--empty {
    color: var(--app-text);
    font-weight: 500;
}

.lyrics-trigger__icon {
    flex-shrink: 0;
    color: var(--app-muted);
    transition: color 0.2s ease;
}

.lyrics-trigger:hover {
    color: #1890ff;
    background: var(--app-active-bg);
    border-color: rgba(24, 144, 255, 0.35);
    box-shadow: 0 6px 18px rgba(24, 144, 255, 0.18);
    transform: translateY(-1px);
}

.lyrics-trigger:hover .lyrics-trigger__icon {
    color: #1890ff;
}

.lyrics-trigger:focus-visible {
    outline: 2px solid #1890ff;
    outline-offset: 2px;
}

.lyrics-body {
    /* 绝对定位：面板不参与容器布局，避免把触发按钮挤走 */
    position: absolute;
    right: 0;
    bottom: 100%;
    width: min(360px, calc(100vw - 32px));
    max-height: 60vh;
    margin-bottom: 10px;
    padding: 16px;
    border-radius: 16px;
    background: var(--app-surface);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    border: 1px solid var(--app-border);
    box-shadow: 0 12px 36px rgba(31, 45, 61, 0.16);
    display: flex;
    flex-direction: column;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* 面板头部：同样支持拖动移动面板 */
.lyrics-header {
    flex-shrink: 0;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--app-border);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
}

/* 上方空间不足时，面板改为在按钮下方展开 */
.lyrics-panel--below .lyrics-body {
    bottom: auto;
    top: 100%;
    margin-bottom: 0;
    margin-top: 10px;
}

.lyrics-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.lyrics-artist {
    margin-top: 2px;
    font-size: 12px;
    color: var(--app-muted);
}

.lyrics-list {
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
    text-align: center;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
}

.lyrics-list--dragging {
    cursor: grabbing;
}

.lyrics-line {
    margin: 0;
    padding: 7px 4px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--app-muted);
    border-radius: 8px;
    cursor: pointer;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s ease,
        font-weight 0.2s ease;
}

/* 悬停高亮（激活行使用渐变文字，不覆盖其背景） */
.lyrics-line:not(.lyrics-line--active):hover {
    color: var(--app-text);
    background: var(--app-hover);
}

.lyrics-line--active {
    font-weight: 600;
    transform: scale(1.04);
    /* 彩色流动渐变文字：背景裁切到文字 */
    background: linear-gradient(90deg, #22c55e, #38bdf8, #a855f7, #f472b6, #22c55e);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    animation: lyric-flow 6s linear infinite;
}

@keyframes lyric-flow {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 300% 50%;
    }
}

.lyrics-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    color: var(--app-muted);
    font-size: 14px;
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
    .lyrics-panel {
        right: 12px;
        left: 12px;
        align-items: stretch;
        /* 上移避开紧凑播放条与底部安全区 */
        bottom: calc(88px + env(safe-area-inset-bottom, 0px));
    }

    .lyrics-panel--shifted {
        bottom: calc(56px + env(safe-area-inset-bottom, 0px));
    }

    /* 移动端触发按钮铺满，便于点按 */
    .lyrics-trigger {
        width: 100%;
        justify-content: space-between;
        padding: 10px 14px;
    }

    .lyrics-trigger__now {
        max-width: none;
        flex: 1;
        text-align: left;
    }

    /* 面板宽度自适应，避免超出视口 */
    .lyrics-body {
        width: 100%;
        max-height: 52vh;
    }
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
        /* 降低动效：保留彩色但停止流动 */
        animation: none;
    }
}
</style>
