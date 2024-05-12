import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import VoteAuthView from '../views/VoteAuthView.vue'
import VoteRedirectView from '../views/VoteRedirectView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/:vote_id/redirect',
      name: 'voteRedirect',
      component: VoteRedirectView
    },
    {
      path: '/:vote_id',
      name: 'voteAuth',
      component: VoteAuthView
    }
  ]
})

export default router
