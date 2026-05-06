import { createRouter, createWebHistory } from "vue-router";
import EscortReviews from "../views/Admin/EscortReviews.vue";
import AuthPage from "../views/Auth/AuthPage.vue";
import BookEscort from "../views/Book/BookEscort.vue";
import HomeView from "../views/Home/HomeView.vue";
import OrderList from "../views/Order/OrderList.vue";
import ApplyEscort from "../views/Profile/ApplyEscort.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/auth",
      name: "auth",
      component: AuthPage,
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/profile/apply",
      name: "profile-apply",
      component: ApplyEscort,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/book",
      name: "BookEscort",
      component: BookEscort,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/orders",
      name: "OrderList",
      component: OrderList,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/admin/escort-reviews",
      name: "AdminEscortReviews",
      component: EscortReviews,
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
