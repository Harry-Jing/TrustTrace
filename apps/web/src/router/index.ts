import { createRouter, createWebHistory } from "vue-router";

import AppShell from "@/app/AppShell.vue";
import { showDevTools } from "@/app/env";
import CheckHomePage from "@/features/checks/pages/CheckHomePage.vue";
import { DEMO_CHECK_ID } from "@/features/checks/fixtures/demoChecks";

declare module "vue-router" {
  interface RouteMeta {
    depth?: number;
    title?: string;
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: AppShell,
      children: [
        {
          path: "",
          redirect: "/checks/new",
        },
        {
          path: "checks/new",
          name: "landing",
          component: CheckHomePage,
          meta: { depth: 0, title: "New check" },
        },
        // DEV ONLY — shorthand redirects to demo check pages
        ...(showDevTools
          ? [
              { path: "loading", redirect: `/checks/${DEMO_CHECK_ID}/loading` },
              { path: "result", redirect: `/checks/${DEMO_CHECK_ID}/result` },
              { path: "error", redirect: `/checks/${DEMO_CHECK_ID}/error` },
            ]
          : []),

        {
          path: "checks/:checkId/loading",
          name: "loading",
          meta: { depth: 1, title: "Checking" },
          component: () => import("@/features/checks/pages/CheckLoadingPage.vue"),
        },
        {
          path: "checks/:checkId/result",
          name: "result",
          meta: { depth: 2, title: "Result" },
          component: () => import("@/features/checks/pages/CheckResultPage.vue"),
        },
        {
          path: "checks/:checkId/error",
          name: "error",
          meta: { depth: 2, title: "Check failed" },
          component: () => import("@/features/checks/pages/CheckErrorPage.vue"),
        },
        {
          path: "history",
          name: "history",
          meta: { depth: 1, title: "History" },
          component: () => import("@/features/checks/pages/CheckHistoryPage.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "landing" },
    },
  ],
});

router.afterEach((to) => {
  if (typeof document === "undefined") return;

  document.title = to.meta.title ? `${to.meta.title} · TrustTrace` : "TrustTrace";
});
