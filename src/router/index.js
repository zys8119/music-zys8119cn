import { createRouter, createWebHistory } from 'vue-router'
import DiscoverView from '../views/DiscoverView.vue'
import FavoritesView from '../views/FavoritesView.vue'
import RecentView from '../views/RecentView.vue'
import AlbumsView from '../views/AlbumsView.vue'
import CategoryView from '../views/CategoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/discover'
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverView
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView
    },
    {
      path: '/recent',
      name: 'recent',
      component: RecentView
    },
    {
      path: '/albums',
      name: 'albums',
      component: AlbumsView
    },
    {
      path: '/category/:id',
      name: 'category',
      component: CategoryView,
      props: true
    }
  ]
})

export default router