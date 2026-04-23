import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '@/app/AppShell.vue'
import { showDevTools } from '@/app/env'
import CheckHomePage from '@/features/checks/pages/CheckHomePage.vue'
import { DEMO_CHECK_ID } from '@/features/checks/fixtures/demoChecks'

declare module 'vue-router' {
  interface RouteMeta {
    depth?: number
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          redirect: '/checks/new',
        },
        {
          path: 'checks/new',
          name: 'landing',
          component: CheckHomePage,
          meta: { depth: 0 },
        },
        // DEV ONLY — shorthand redirects to demo check pages
        ...(showDevTools
          ? [
              { path: 'loading', redirect: `/checks/${DEMO_CHECK_ID}/loading` },
              { path: 'result', redirect: `/checks/${DEMO_CHECK_ID}/result` },
              { path: 'error', redirect: `/checks/${DEMO_CHECK_ID}/error` },
            ]
          : []),

        {
          path: 'checks/:checkId/loading',
          name: 'loading',
          meta: { depth: 1 },
          component: () => import('@/features/checks/pages/CheckLoadingPage.vue'),
        },
        {
          path: 'checks/:checkId/result',
          name: 'result',
          meta: { depth: 2 },
          component: () => import('@/features/checks/pages/CheckResultPage.vue'),
        },
        {
          path: 'checks/:checkId/error',
          name: 'error',
          meta: { depth: 2 },
          component: () => import('@/features/checks/pages/CheckErrorPage.vue'),
        },
        {
          path: 'history',
          name: 'history',
          meta: { depth: 1 },
          component: () => import('@/features/checks/pages/CheckHistoryPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'landing' },
    },
  ],
})
