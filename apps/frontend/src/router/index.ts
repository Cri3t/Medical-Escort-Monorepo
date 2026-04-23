import { createRouter, createWebHistory } from 'vue-router'
import AuthPage from '../views/Auth/AuthPage.vue'
import HomeView from '../views/Home/HomeView.vue'
import ApplyEscort from '../views/Profile/ApplyEscort.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage,
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/profile/apply',
      name: 'profile-apply',
      component: ApplyEscort,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  if (to.path !== '/auth' && !token) {
    return '/auth'
  }

  return true
})

export default router
