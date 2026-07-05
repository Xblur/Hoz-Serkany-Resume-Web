import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import GestureDemoView from './views/GestureDemoView.vue'

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/demos/gesture-recognition',
      name: 'gesture-demo',
      component: GestureDemoView,
      meta: { title: 'Facial Gesture Recognition Demo' },
    },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? 'Hoz Serkany — Computer Engineering'
  document.title = title
})
