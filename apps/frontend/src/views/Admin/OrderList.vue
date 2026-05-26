<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-vue-next";
import { getAdminOrders, type AdminOrder } from "@/api/admin";
import type { OrderStatus } from "@/api/order";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import UserNav from "@/components/UserNav.vue";
import { Button } from "@/components/ui/button";

interface StoredUser {
  nickname?: string;
  phone?: string;
  role?: string;
}

interface StatusMeta {
  labelKey: string;
  className: string;
}

const orderStatusOptions: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PENDING_ACCEPT",
  "IN_SERVICE",
  "COMPLETED",
  "CANCELLED",
];

const statusMap: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: {
    labelKey: "orders.status.pendingPayment",
    className: "order-status--pending-payment",
  },
  PENDING_ACCEPT: {
    labelKey: "orders.status.pendingAccept",
    className: "order-status--pending-accept",
  },
  IN_SERVICE: {
    labelKey: "orders.status.inService",
    className: "order-status--in-service",
  },
  COMPLETED: {
    labelKey: "orders.status.completed",
    className: "order-status--completed",
  },
  CANCELLED: {
    labelKey: "orders.status.cancelled",
    className: "order-status--cancelled",
  },
};

const page = ref(1);
const pageSize = 10;
const total = ref(0);
const orders = ref<AdminOrder[]>([]);
const selectedStatus = ref<OrderStatus | "">("");
const loading = ref(false);
const { locale, t } = useI18n();

const intlLocale = computed(() => (locale.value === "zh-CN" ? "zh-CN" : "en-US"));

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

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
    return t("admin.userFallback");
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

onMounted(() => {
  void loadOrders();
});

async function loadOrders() {
  loading.value = true;

  try {
    const data = await getAdminOrders({
      page: page.value,
      pageSize,
      ...(selectedStatus.value ? { status: selectedStatus.value } : {}),
    });

    orders.value = data.list;
    total.value = data.total;
    page.value = data.page;
  } finally {
    loading.value = false;
  }
}

async function handleStatusChange() {
  page.value = 1;
  await loadOrders();
}

async function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) {
    return;
  }

  page.value = nextPage;
  await loadOrders();
}

function getStatusMeta(status: OrderStatus) {
  return statusMap[status];
}

function getStatusLabel(status: OrderStatus) {
  return t(getStatusMeta(status).labelKey);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(intlLocale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatAmount(value: number) {
  return new Intl.NumberFormat(intlLocale.value, {
    style: "currency",
    currency: "CNY",
  }).format(value);
}
</script>

<template>
  <main class="admin-orders-page">
    <PageHeader :eyebrow="t('admin.console')" :title="t('adminOrders.title')">
      <template #actions>
        <UserNav :display-name="displayName" :user="user" />
      </template>
    </PageHeader>

    <section class="admin-orders-content">
      <div class="admin-orders-toolbar">
        <div>
          <h2 class="admin-orders-toolbar__title">{{ t("adminOrders.listTitle") }}</h2>
          <p class="admin-orders-toolbar__description">
            {{ t("adminOrders.total", { total }) }}
          </p>
        </div>

        <div class="admin-orders-toolbar__actions">
          <label class="admin-orders-filter">
            <span class="admin-orders-filter__label">{{ t("adminOrders.statusFilter") }}</span>
            <select
              v-model="selectedStatus"
              class="admin-orders-filter__select"
              :disabled="loading"
              @change="handleStatusChange"
            >
              <option value="">{{ t("adminOrders.allStatuses") }}</option>
              <option v-for="status in orderStatusOptions" :key="status" :value="status">
                {{ getStatusLabel(status) }}
              </option>
            </select>
          </label>

          <Button variant="outline" :disabled="loading" @click="loadOrders">
            <Loader2 v-if="loading" class="admin-orders-icon admin-orders-icon--spin" aria-hidden="true" />
            <RefreshCw v-else class="admin-orders-icon" aria-hidden="true" />
            <span>{{ t("adminOrders.refresh") }}</span>
          </Button>
        </div>
      </div>

      <div class="admin-orders-table-card">
        <div v-if="loading" class="admin-orders-loading">
          <Loader2 class="admin-orders-icon admin-orders-icon--spin" aria-hidden="true" />
          <span>{{ t("adminOrders.loading") }}</span>
        </div>

        <div v-else-if="orders.length === 0" class="admin-orders-empty">
          {{ t("adminOrders.empty") }}
        </div>

        <div v-else class="admin-orders-table-scroll">
          <table class="admin-orders-table">
            <thead class="admin-orders-table__head">
              <tr>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.orderNo") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.patient") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.escort") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.hospitalAndService") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.amount") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.status") }}</th>
                <th class="admin-orders-table__header-cell">{{ t("adminOrders.createdAt") }}</th>
              </tr>
            </thead>
            <tbody class="admin-orders-table__body">
              <tr v-for="order in orders" :key="order.id" class="admin-orders-table__row">
                <td class="admin-orders-table__primary">
                  {{ order.orderNo }}
                </td>
                <td class="admin-orders-table__cell">
                  <p class="admin-orders-table__participant">
                    {{ order.customer.nickname || t("admin.nicknameFallback") }}
                  </p>
                  <p class="admin-orders-table__secondary">{{ order.customer.phone }}</p>
                </td>
                <td class="admin-orders-table__cell">
                  <template v-if="order.escort">
                    <p class="admin-orders-table__participant">
                      {{ order.escort.nickname || t("admin.nicknameFallback") }}
                    </p>
                    <p class="admin-orders-table__secondary">{{ order.escort.phone }}</p>
                  </template>
                  <span v-else class="admin-orders-table__secondary">
                    {{ t("adminOrders.unassignedEscort") }}
                  </span>
                </td>
                <td class="admin-orders-table__cell">
                  <p class="admin-orders-table__participant">{{ order.hospitalName }}</p>
                  <p class="admin-orders-table__secondary">{{ formatDateTime(order.serviceAt) }}</p>
                  <p class="admin-orders-table__secondary">
                    {{
                      order.remark
                        ? t("adminOrders.remark", { remark: order.remark })
                        : t("adminOrders.noRemark")
                    }}
                  </p>
                </td>
                <td class="admin-orders-table__cell">
                  {{ formatAmount(order.amount) }}
                </td>
                <td class="admin-orders-table__cell">
                  <span class="order-status" :class="getStatusMeta(order.status).className">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
                <td class="admin-orders-table__cell">
                  {{ formatDateTime(order.createdAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-orders-pagination">
        <span>{{ t("adminOrders.pageInfo", { page, totalPages }) }}</span>
        <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
          <ChevronLeft class="admin-orders-icon" aria-hidden="true" />
          <span>{{ t("adminOrders.previousPage") }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= totalPages || loading"
          @click="changePage(page + 1)"
        >
          <span>{{ t("adminOrders.nextPage") }}</span>
          <ChevronRight class="admin-orders-icon" aria-hidden="true" />
        </Button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.admin-orders-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.admin-orders-content {
  @apply mx-auto max-w-7xl px-4 py-10;
}

.admin-orders-toolbar {
  @apply mb-6 flex flex-wrap items-end justify-between gap-4;
}

.admin-orders-toolbar__title {
  @apply text-xl font-semibold text-slate-950;
}

.admin-orders-toolbar__description {
  @apply mt-2 text-sm text-slate-500;
}

.admin-orders-toolbar__actions {
  @apply flex flex-wrap items-end gap-3;
}

.admin-orders-filter {
  @apply flex flex-col gap-2;
}

.admin-orders-filter__label {
  @apply text-sm font-medium text-slate-700;
}

.admin-orders-filter__select {
  @apply h-9 min-w-[11rem] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-orders-icon {
  @apply h-4 w-4;
}

.admin-orders-icon--spin {
  @apply animate-spin;
}

.admin-orders-table-card {
  @apply overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm;
}

.admin-orders-loading {
  @apply flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500;
}

.admin-orders-empty {
  @apply px-4 py-16 text-center text-sm text-slate-500;
}

.admin-orders-table-scroll {
  @apply overflow-x-auto;
}

.admin-orders-table {
  @apply w-full min-w-[1120px] border-collapse text-left text-sm;
}

.admin-orders-table__head {
  @apply bg-slate-50 text-xs uppercase tracking-normal text-slate-500;
}

.admin-orders-table__header-cell {
  @apply whitespace-nowrap px-5 py-3 font-medium;
}

.admin-orders-table__body {
  @apply divide-y divide-slate-200;
}

.admin-orders-table__row {
  @apply align-top hover:bg-slate-50/70;
}

.admin-orders-table__cell {
  @apply px-5 py-4 text-slate-600;
}

.admin-orders-table__primary {
  @apply whitespace-nowrap px-5 py-4 font-mono font-medium text-slate-950;
}

.admin-orders-table__participant {
  @apply font-medium text-slate-950;
}

.admin-orders-table__secondary {
  @apply mt-1 text-xs leading-5 text-slate-500;
}

.order-status {
  @apply inline-flex w-fit whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1;
}

.order-status--pending-payment {
  @apply bg-orange-50 text-orange-700 ring-orange-200;
}

.order-status--pending-accept {
  @apply bg-sky-50 text-sky-700 ring-sky-200;
}

.order-status--in-service {
  @apply bg-blue-50 text-blue-700 ring-blue-200;
}

.order-status--completed {
  @apply bg-green-50 text-green-700 ring-green-200;
}

.order-status--cancelled {
  @apply bg-slate-100 text-slate-600 ring-slate-200;
}

.admin-orders-pagination {
  @apply mt-5 flex items-center justify-end gap-3 text-sm text-slate-500;
}
</style>
