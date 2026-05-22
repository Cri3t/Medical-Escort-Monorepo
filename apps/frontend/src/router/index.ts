import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/auth",
      name: "auth",
      component: () => import("../views/Auth/AuthPage.vue"),
    },
    {
      path: "/",
      name: "home",
      component: () => import("../views/Home/HomeView.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/profile/apply",
      name: "profile-apply",
      component: () => import("../views/Profile/ApplyEscort.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/book",
      name: "BookEscort",
      component: () => import("../views/Book/BookEscort.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/orders",
      name: "OrderList",
      component: () => import("../views/Order/OrderList.vue"),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/admin/escort-reviews",
      name: "AdminEscortReviews",
      component: () => import("../views/Admin/EscortReviews.vue"),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");

  if (!["/auth"].includes(to.path) && !token) {
    return "/auth";
  }

  if (to.meta.requiresAdmin) {
    if (!rawUser) {
      return "/auth";
    }

    try {
      const user = JSON.parse(rawUser) as { role?: string };

      if (user.role !== "ADMIN") {
        return "/";
      }
    } catch {
      return "/auth";
    }
  }

  return true;
});

export default router;
