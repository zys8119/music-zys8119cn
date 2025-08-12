import type { RouteRecordRaw } from 'vue-router'

// 由于使用自动导入，需要显式导入这两个函数
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/discover'
  },
  {
    path: '/discover',
    name: 'discover',
    component: () => import('../views/DiscoverView.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue')
  },
  {
    path: '/recent',
    name: 'recent',
    component: () => import('../views/RecentView.vue')
  },
  {
    path: '/albums',
    name: 'albums',
    component: () => import('../views/AlbumsView.vue')
  },
  {
    path: '/category/:id',
    name: 'category',
    component: () => import('../views/CategoryView.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router