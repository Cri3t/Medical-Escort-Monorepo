<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { io, type Socket } from "socket.io-client";
import { ORDER_LIST_REFRESH_EVENT, type OrderRealtimePayload } from "@/realtime/orders";

type NotificationType = "pending" | "rejected";

interface OrderNotification {
  type: NotificationType;
  orderNo: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const notification = ref<OrderNotification | null>(null);
let socket: Socket | null = null;
let socketToken = "";

watch(
  () => route.fullPath,
  () => {
    syncSocketConnection();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  disconnectSocket();
});

function syncSocketConnection() {
  const token = localStorage.getItem("token") ?? "";
  const role = getStoredRole();

  if (!token || route.path === "/auth" || (role !== "USER" && role !== "ESCORT")) {
    notification.value = null;
    disconnectSocket();
    return;
  }

  if (socket && socketToken === token) {
    return;
  }

  disconnectSocket();
  socketToken = token;
  socket = io("http://localhost:3000", {
    auth: { token },
  });
  socket.on("orders:assignment-pending", (payload: OrderRealtimePayload) => {
    receiveNotification("pending", payload);
  });
  socket.on("orders:assignment-rejected", (payload: OrderRealtimePayload) => {
    receiveNotification("rejected", payload);
  });
}

function getStoredRole(): string | null {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return (JSON.parse(rawUser) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

function receiveNotification(type: NotificationType, payload: OrderRealtimePayload) {
  notification.value = {
    type,
    orderNo: payload.orderNo,
  };
  window.dispatchEvent(new CustomEvent(ORDER_LIST_REFRESH_EVENT));
}

function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = "";
}

function openOrders() {
  notification.value = null;
  void router.push("/orders");
}
</script>

<template>
  <div v-if="notification" class="order-notification" role="status">
    <button type="button" class="order-notification__content" @click="openOrders">
      {{
        notification.type === "pending"
          ? t("notifications.assignmentPending", { orderNo: notification.orderNo })
          : t("notifications.assignmentRejected", { orderNo: notification.orderNo })
      }}
      <span class="order-notification__link">{{ t("notifications.viewOrders") }}</span>
    </button>
    <button
      type="button"
      class="order-notification__close"
      :aria-label="t('common.close')"
      @click="notification = null"
    >
      {{ t("common.close") }}
    </button>
  </div>
  <RouterView />
</template>

<style scoped>
.order-notification {
  @apply fixed left-1/2 top-4 z-[60] flex w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 items-center gap-3 rounded-lg border border-teal-200 bg-white px-4 py-3 shadow-lg;
}

.order-notification__content {
  @apply flex-1 text-left text-sm text-slate-700;
}

.order-notification__link {
  @apply ml-2 font-medium text-teal-700;
}

.order-notification__close {
  @apply rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900;
}
</style>
