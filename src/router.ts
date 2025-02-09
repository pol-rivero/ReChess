import { updateTitle } from '@/helpers/web-utils'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import ThankYouPage from './pages/ThankYouPage.vue'
// https://github.com/mutoe/vue3-realworld-example-app/blob/master/src/router.ts

export type AppRouteNames =
  | 'home'
  | 'home-index'
  | 'variant-details'
  | 'variant-lobby'
  | 'variant-analysis'
  | 'play-offline'
  | 'play-online'
  | 'edit-draft'
  | 'edit-piece'
  | 'draft-play'
  | 'draft-analysis'
  | 'user-profile'
  | 'user-published-variants'
  | 'user-upvoted-variants'
  | 'moderator-dashboard'
  | 'privacy'
  | 'cookies'
  | 'tos'

export const routes: RouteRecordRaw[] = [
  
  // {
  //   name: 'home',
  //   path: '/',
  //   component: HomePage,
  // },
  // {
  //   name: 'home-index',
  //   path: '/index.html',
  //   component: HomePage,
  // },
  {
    name: 'home',
    path: '/',
    component: ThankYouPage,
  },
  {
    name: 'home-index',
    path: '/index.html',
    component: ThankYouPage,
  },
  
  
  {
    name: 'variant-details',
    path: '/variant/:variantId',
    component: () => import('@/pages/variant/VariantDetailsPage.vue'),
  },
  {
    name: 'variant-lobby',
    path: '/variant/:variantId/lobby',
    component: () => import('@/pages/game/LobbyPage.vue'),
  },
  {
    name: 'variant-analysis',
    path: '/variant/:variantId/analysis',
    component: () => import('@/pages/game/AnalysisPage.vue'),
    meta: { title: 'Analysis Board' },
  },
  {
    name: 'play-offline',
    path: '/variant/:variantId/play',
    component: () => import('@/pages/game/LocalPlayPage.vue'),
  },
  {
    name: 'play-online',
    path: '/game/:gameId',
    component: () => import('@/pages/game/OnlinePlayPage.vue'),
  },
  
  
  {
    name: 'edit-draft',
    path: '/draft',
    component: () => import('@/pages/variant/EditVariantPage.vue'),
    meta: { title: 'Edit Draft' },
  },
  {
    name: 'edit-piece',
    path: '/draft/pieces/:pieceIndex',
    component: () => import('@/pages/variant/EditPiecePage.vue'),
    meta: { title: 'Edit Piece' },
  },
  {
    name: 'draft-play',
    path: '/draft/play',
    component: () => import('@/pages/game/LocalPlayPage.vue'),
  },
  {
    name: 'draft-analysis',
    path: '/draft/analysis',
    component: () => import('@/pages/game/AnalysisPage.vue'),
    meta: { title: 'Analysis Board' },
  },
  
  
  {
    name: 'user-profile',
    path: '/user/:username',
    component: () => import('@/pages/user/UserProfilePage.vue'),
  },
  {
    name: 'user-published-variants',
    path: '/user/:username/variants',
    component: () => import('@/pages/user/UserPublishedVariantsPage.vue'),
  },
  {
    name: 'user-upvoted-variants',
    path: '/user/:username/upvoted',
    component: () => import('@/pages/user/UserUpvotedVariantsPage.vue'),
  },
  
  {
    name: 'moderator-dashboard',
    path: '/moderate',
    component: () => import('@/pages/moderator/ModeratorDashboardPage.vue'),
    meta: { title: 'Moderator Dashboard' },
  },
  
  
  {
    name: 'privacy',
    path: '/privacy',
    component: () => import('@/pages/legal/PrivacyPolicyPage.vue'),
    meta: { title: 'Privacy Policy' },
  },
  {
    name: 'cookies',
    path: '/cookies',
    component: () => import('@/pages/legal/CookiePolicyPage.vue'),
    meta: { title: 'Cookie Policy' },
  },
  {
    name: 'tos',
    path: '/tos',
    component: () => import('@/pages/legal/TermsOfServicePage.vue'),
    meta: { title: 'Terms of Service' },
  },
  
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/pages/NotFoundPage.vue'),
  },

  {
    name: 'thanks',

    path: '/thanks',
    component: () => import('@/pages/ThankYouPage.vue'),
  },
]
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.path !== '/thanks') {
    next('/thanks')
  } else {
    next()
  }
  return
  const toTitle = to.meta.title as string | undefined
  updateTitle(toTitle)
  next()
})
