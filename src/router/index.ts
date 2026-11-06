import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/posts',
      name: 'posts',
      component: () => import('@/views/PostsView.vue'),
      meta: { title: '日常流', keepAlive: true },
    },
    {
      path: '/posts/:id',
      name: 'post',
      component: () => import('@/views/PostDetailView.vue'),
      meta: { title: '文章' },
    },
    {
      path: '/collections',
      name: 'collections',
      component: () => import('@/views/CollectionsView.vue'),
      meta: { title: '综集' },
    },
    {
      path: '/collections/:id',
      name: 'collection',
      component: () => import('@/views/CollectionDetailView.vue'),
      meta: { title: '综集' },
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardView.vue'),
      meta: { title: '留言墙' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '404', bare: true },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 110, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const base = '爆裂魔法使的手记'
  document.title = to.meta.title ? `${to.meta.title as string} · ${base}` : base
})

export default router
