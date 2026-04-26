<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import UserNav from "@/components/UserNav.vue";
import { Button } from "@/components/ui/button";
import {
  acceptOrder,
  completeOrder,
  getMyOrders,
  payOrder,
} from "@/api/order";
import type { Order, OrderStatus } from "@/api/order";

interface StoredUser {
  nickname?: string;
  phone?: string;
  role?: string;
}

interface StatusMeta {
  label: string;
  className: string;
}

type OrderAction = "pay" | "accept" | "complete";

const statusMap: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: {
    label: "Pending Payment",
    className: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  PENDING_ACCEPT: {
    label: "Waiting for Acceptance",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  IN_SERVICE: {
    label: "In Service",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-50 text-green-700 ring-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

const orders = ref<Order[]>([]);
const loading = ref(false);
const actionLoadingKey = ref("");

const user = computed<StoredUser>(() => {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return {};
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return {};
  }
});

const displayName = computed(() => {
  if (user.value.nickname) {
    return user.value.nickname;
  }

  const phone = user.value.phone;

  if (!phone || phone.length < 7) {
    return "User";
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

onMounted(() => {
  void fetchOrders();
});

async function fetchOrders() {
  loading.value = true;

  try {
    orders.value = await getMyOrders();
  } finally {
    loading.value = false;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatAmount(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amount);
}

function getStatusMeta(status: OrderStatus) {
  return statusMap[status];
}

function getActionKey(order: Order, action: OrderAction) {
  return `${order.id}:${action}`;
}

function isActionLoading(order: Order, action: OrderAction) {
  return actionLoadingKey.value === getActionKey(order, action);
}

function isAnyActionLoading() {
  return actionLoadingKey.value !== "";
}

function canPay(order: Order) {
  return user.value.role === "USER" && order.status === "PENDING_PAYMENT";
}

function canAccept(order: Order) {
  return user.value.role === "ESCORT" && order.status === "PENDING_ACCEPT";
}

function canComplete(order: Order) {
  return user.value.role === "ESCORT" && order.status === "IN_SERVICE";
}

async function runOrderAction(
  order: Order,
  action: OrderAction,
  actionRequest: (id: string) => Promise<Order>,
  successMessage: string,
) {
  if (isAnyActionLoading()) {
    return;
  }

  actionLoadingKey.value = getActionKey(order, action);

  try {
    await actionRequest(order.id);
    alert(successMessage);
    await fetchOrders();
  } catch {
    // The request interceptor already displays backend error messages.
  } finally {
    actionLoadingKey.value = "";
  }
}

async function handlePay(order: Order) {
  await runOrderAction(order, "pay", payOrder, "支付成功");
}

async function handleAccept(order: Order) {
  await runOrderAction(order, "accept", acceptOrder, "已接单");
}

async function handleComplete(order: Order) {
  await runOrderAction(order, "complete", completeOrder, "服务已完成");
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5"
      >
        <h1 class="text-2xl font-semibold tracking-normal text-slate-950">
          My Orders
        </h1>
        <UserNav :display-name="displayName" :user="user" />
      </div>
    </header>

    <section class="container mx-auto max-w-4xl px-4 py-8">
      <div v-if="loading" class="space-y-4">
        <article
          v-for="index in 3"
          :key="index"
          class="animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="h-5 w-48 rounded bg-slate-200"></div>
          <div class="mt-6 h-4 w-full rounded bg-slate-100"></div>
          <div class="mt-3 h-4 w-2/3 rounded bg-slate-100"></div>
        </article>
      </div>

      <div
        v-else-if="orders.length === 0"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
      >
        <p class="text-base font-medium text-slate-700">No orders yet</p>
        <p class="mt-2 text-sm text-slate-500">
          Orders will appear here after you create an escort booking.
        </p>
      </div>

      <div v-else class="space-y-4">
        <article
          v-for="order in orders"
          :key="order.id"
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="min-w-0">
              <p class="text-sm text-slate-500">Order No.</p>
              <h2 class="mt-1 break-all text-lg font-semibold text-slate-950">
                {{ order.orderNo }}
              </h2>
              <p class="mt-2 text-sm text-slate-500">
                Created at: {{ formatDateTime(order.createdAt) }}
              </p>
            </div>
            <span
              class="inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ring-1"
              :class="getStatusMeta(order.status).className"
            >
              {{ getStatusMeta(order.status).label }}
            </span>
          </div>

          <dl class="grid gap-4 py-5 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-slate-500">Escort</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ order.escort?.nickname || "Waiting for acceptance" }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Order Amount</dt>
              <dd class="mt-1 text-base font-semibold text-slate-950">
                {{ formatAmount(order.amount) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Hospital Name</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ order.hospitalName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">Appointment Time</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ formatDateTime(order.serviceAt) }}
              </dd>
            </div>
          </dl>

          <div class="flex justify-end border-t border-slate-100 pt-4">
            <Button
              v-if="canPay(order)"
              type="button"
              class="bg-orange-600 hover:bg-orange-700"
              :disabled="isAnyActionLoading()"
              @click="handlePay(order)"
            >
              {{ isActionLoading(order, "pay") ? "支付中..." : "去支付" }}
            </Button>
            <Button
              v-else-if="canAccept(order)"
              type="button"
              class="bg-sky-600 hover:bg-sky-700"
              :disabled="isAnyActionLoading()"
              @click="handleAccept(order)"
            >
              {{ isActionLoading(order, "accept") ? "接单中..." : "接单" }}
            </Button>
            <Button
              v-else-if="canComplete(order)"
              type="button"
              class="bg-green-600 hover:bg-green-700"
              :disabled="isAnyActionLoading()"
              @click="handleComplete(order)"
            >
              {{
                isActionLoading(order, "complete")
                  ? "完成中..."
                  : "完成服务"
              }}
            </Button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
