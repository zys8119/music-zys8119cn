import { onBeforeUnmount, ref, watch } from 'vue'

// 与后端分页返回结构保持一致（见 server/main.ts parsePagination）
export interface PageLink {
  label: string
  url: string
  current: boolean
}

export interface PaginationData {
  current: number
  total: number
  items: PageLink[]
}

/**
 * 从分页数据中解析“下一页”链接。
 * 优先使用站点提供的“下一页”条目，其次回退到 current + 1 的数字页码。
 */
export function getNextPageLink(
  pagination: PaginationData | null | undefined
): PageLink | null {
  const items = pagination?.items
  if (!items || items.length === 0) return null

  // 1. 优先匹配“下一页”文本
  const nextLink = items.find(
    (item) => item.url && (item.label.includes('下一页') || item.label === '下页')
  )
  if (nextLink) return nextLink

  // 2. 回退：查找 current + 1 对应的数字页码
  const targetLabel = String((pagination?.current || 1) + 1)
  return items.find((item) => item.url && item.label === targetLabel) || null
}

interface UseInfiniteScrollOptions {
  // 是否还有下一页
  hasMore: () => boolean
  // 是否正在加载（加载中不重复触发）
  isLoading: () => boolean
  // 触发加载更多
  onLoadMore: () => void | Promise<void>
  // 提前触发的距离，默认提前 200px
  rootMargin?: string
}

/**
 * 上拉加载更多：监听底部哨兵元素进入视口时触发加载。
 * 返回 sentinelEl，需绑定到列表底部的哨兵元素上。
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const sentinelEl = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  function tryLoad() {
    if (options.isLoading()) return
    if (!options.hasMore()) return
    options.onLoadMore()
  }

  watch(sentinelEl, (el) => {
    observer?.disconnect()
    if (!el || typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) tryLoad()
      },
      { rootMargin: options.rootMargin || '200px' }
    )
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { sentinelEl }
}
