<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import UserNav from "@/components/UserNav.vue";
import { Button } from "@/components/ui/button";
import {
  acceptOrder,
  completeOrder,
  getMyOrders,
  payOrder,
  rejectOrder,
  userUpdateOrder,
} from "@/api/order";
import type { Order, OrderStatus, UserUpdateOrderPayload } from "@/api/order";

interface StoredUser {
  id?: string;
  nickname?: string;
  phone?: string;
  role?: string;
}

interface StatusMeta {
  labelKey: string;
  className: string;
}

type OrderAction = "pay" | "accept" | "complete" | "reject";
type EditMode = "remark" | "amount";

const statusMap: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: {
    labelKey: "orders.status.pendingPayment",
    className: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  PENDING_ACCEPT: {
    labelKey: "orders.status.pendingAccept",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  IN_SERVICE: {
    labelKey: "orders.status.inService",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  COMPLETED: {
    labelKey: "orders.status.completed",
    className: "bg-green-50 text-green-700 ring-green-200",
  },
  CANCELLED: {
    labelKey: "orders.status.cancelled",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

const orders = ref<Order[]>([]);
const loading = ref(false);
const actionLoadingKey = ref("");
const editingOrder = ref<Order | null>(null);
const editMode = ref<EditMode | null>(null);
const remarkInput = ref("");
const amountInput = ref("");
const editSubmitting = ref(false);
const { locale, t } = useI18n();

const intlLocale = computed(() => (locale.value === "zh-CN" ? "zh-CN" : "en-US"));

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
    return t("orders.userFallback");
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const editTitle = computed(() => {
  if (editMode.value === "remark") {
    return t("orders.editRemarkTitle");
  }

  return t("orders.editAmountTitle");
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

  return new Intl.DateTimeFormat(intlLocale.value, {
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

  return new Intl.NumberFormat(intlLocale.value, {
    style: "currency",
    currency: "CNY",
  }).format(amount);
}

function getStatusMeta(status: OrderStatus) {
  return statusMap[status];
}

function getStatusLabel(status: OrderStatus) {
  return t(getStatusMeta(status).labelKey);
}

function getActionKey(order: Order, action: OrderAction) {
  return `${order.id}:${action}`;
}

function isActionLoading(order: Order, action: OrderAction) {
  return actionLoadingKey.value === getActionKey(order, action);
}

function isAnyActionLoading() {
  return actionLoadingKey.value !== "" || editSubmitting.value;
}

function canPay(order: Order) {
  return user.value.role === "USER" && order.status === "PENDING_PAYMENT";
}

function canUpdateRemark(order: Order) {
  return (
    user.value.role === "USER" &&
    (order.status === "PENDING_PAYMENT" || order.status === "PENDING_ACCEPT")
  );
}

function canUpdateAmount(order: Order) {
  return user.value.role === "USER" && order.status === "PENDING_ACCEPT";
}

function canAccept(order: Order) {
  return (
    user.value.role === "ESCORT" &&
    order.status === "PENDING_ACCEPT" &&
    order.escortId === user.value.id
  );
}

function canReject(order: Order) {
  return canAccept(order);
}

function canComplete(order: Order) {
  return (
    user.value.role === "ESCORT" &&
    order.status === "IN_SERVICE" &&
    order.escortId === user.value.id
  );
}

function hasVisibleActions(order: Order) {
  return (
    canPay(order) ||
    canUpdateRemark(order) ||
    canUpdateAmount(order) ||
    canAccept(order) ||
    canReject(order) ||
    canComplete(order)
  );
}

function openRemarkEditor(order: Order) {
  editingOrder.value = order;
  editMode.value = "remark";
  remarkInput.value = order.remark ?? "";
}

function openAmountEditor(order: Order) {
  editingOrder.value = order;
  editMode.value = "amount";
  amountInput.value = String(Number(order.amount));
}

function closeEditor() {
  if (editSubmitting.value) {
    return;
  }

  editingOrder.value = null;
  editMode.value = null;
  remarkInput.value = "";
  amountInput.value = "";
}

function buildEditPayload(): UserUpdateOrderPayload | null {
  if (editMode.value === "remark") {
    return {
      remark: remarkInput.value.trim(),
    };
  }

  const amount = Number(amountInput.value);

  if (
    amountInput.value.trim() === "" ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(amountInput.value.trim())
  ) {
    alert(t("orders.invalidEditAmount"));
    return null;
  }

  return {
    amount,
  };
}

async function submitEditor() {
  if (!editingOrder.value || !editMode.value || editSubmitting.value) {
    return;
  }

  const payload = buildEditPayload();

  if (!payload) {
    return;
  }

  editSubmitting.value = true;

  try {
    await userUpdateOrder(editingOrder.value.id, payload);
    alert(t("orders.updateSuccess"));
    closeEditorAfterSubmit();
    await fetchOrders();
  } catch {
    // The request interceptor already displays backend error messages.
  } finally {
    editSubmitting.value = false;
  }
}

function closeEditorAfterSubmit() {
  editingOrder.value = null;
  editMode.value = null;
  remarkInput.value = "";
  amountInput.value = "";
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
  await runOrderAction(order, "pay", payOrder, t("orders.paySuccess"));
}

async function handleAccept(order: Order) {
  await runOrderAction(order, "accept", acceptOrder, t("orders.acceptSuccess"));
}

async function handleComplete(order: Order) {
  await runOrderAction(order, "complete", completeOrder, t("orders.completeSuccess"));
}

async function handleReject(order: Order) {
  const confirmed = window.confirm(t("orders.rejectConfirm"));

  if (!confirmed) {
    return;
  }

  await runOrderAction(order, "reject", rejectOrder, t("orders.rejectSuccess"));
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5"
      >
        <h1 class="text-2xl font-semibold tracking-normal text-slate-950">
          {{ t("orders.title") }}
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
        <p class="text-base font-medium text-slate-700">{{ t("orders.emptyTitle") }}</p>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("orders.emptyDescription") }}
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
              <p class="text-sm text-slate-500">{{ t("orders.orderNo") }}</p>
              <h2 class="mt-1 break-all text-lg font-semibold text-slate-950">
                {{ order.orderNo }}
              </h2>
              <p class="mt-2 text-sm text-slate-500">
                {{ t("orders.createdAt", { time: formatDateTime(order.createdAt) }) }}
              </p>
            </div>
            <span
              class="inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ring-1"
              :class="getStatusMeta(order.status).className"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>

          <dl class="grid gap-4 py-5 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-slate-500">{{ t("orders.escort") }}</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ order.escort?.nickname || t("orders.waitingAccept") }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">{{ t("orders.amount") }}</dt>
              <dd class="mt-1 text-base font-semibold text-slate-950">
                {{ formatAmount(order.amount) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">{{ t("orders.hospitalName") }}</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ order.hospitalName }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-slate-500">{{ t("orders.serviceAt") }}</dt>
              <dd class="mt-1 text-base font-medium text-slate-900">
                {{ formatDateTime(order.serviceAt) }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-slate-500">{{ t("orders.remark") }}</dt>
              <dd class="mt-1 whitespace-pre-wrap break-words text-base text-slate-900">
                {{ order.remark || t("orders.noRemark") }}
              </dd>
            </div>
          </dl>

          <div
            v-if="hasVisibleActions(order)"
            class="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4"
          >
            <Button
              v-if="canUpdateRemark(order)"
              type="button"
              variant="outline"
              :disabled="isAnyActionLoading()"
              @click="openRemarkEditor(order)"
            >
              {{ t("orders.updateRemark") }}
            </Button>
            <Button
              v-if="canUpdateAmount(order)"
              type="button"
              variant="outline"
              :disabled="isAnyActionLoading()"
              @click="openAmountEditor(order)"
            >
              {{ t("orders.updateAmount") }}
            </Button>
            <Button
              v-if="canPay(order)"
              type="button"
              class="bg-orange-600 hover:bg-orange-700"
              :disabled="isAnyActionLoading()"
              @click="handlePay(order)"
            >
              {{ isActionLoading(order, "pay") ? t("orders.paying") : t("orders.pay") }}
            </Button>
            <Button
              v-if="canAccept(order)"
              type="button"
              class="bg-sky-600 hover:bg-sky-700"
              :disabled="isAnyActionLoading()"
              @click="handleAccept(order)"
            >
              {{ isActionLoading(order, "accept") ? t("orders.accepting") : t("orders.accept") }}
            </Button>
            <Button
              v-if="canReject(order)"
              type="button"
              variant="destructive"
              :disabled="isAnyActionLoading()"
              @click="handleReject(order)"
            >
              {{ isActionLoading(order, "reject") ? t("orders.rejecting") : t("orders.reject") }}
            </Button>
            <Button
              v-if="canComplete(order)"
              type="button"
              class="bg-green-600 hover:bg-green-700"
              :disabled="isAnyActionLoading()"
              @click="handleComplete(order)"
            >
              {{
                isActionLoading(order, "complete")
                  ? t("orders.completing")
                  : t("orders.complete")
              }}
            </Button>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="editingOrder"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <section class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">
              {{ editTitle }}
            </h2>
            <p class="mt-1 break-all text-sm text-slate-500">
              {{ editingOrder.orderNo }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            :disabled="editSubmitting"
            @click="closeEditor"
          >
            {{ t("common.close") }}
          </button>
        </div>

        <div class="mt-5">
          <label
            v-if="editMode === 'remark'"
            class="block text-sm font-medium text-slate-700"
          >
            {{ t("orders.remark") }}
            <textarea
              v-model="remarkInput"
              class="mt-2 min-h-32 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              :placeholder="t('orders.remarkPlaceholder')"
            ></textarea>
          </label>

          <label
            v-else
            class="block text-sm font-medium text-slate-700"
          >
            {{ t("orders.amount") }}
            <input
              v-model="amountInput"
              type="number"
              min="0"
              step="0.01"
              class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              :placeholder="t('orders.amountPlaceholder')"
            />
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            :disabled="editSubmitting"
            @click="closeEditor"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            type="button"
            class="bg-teal-600 hover:bg-teal-700"
            :disabled="editSubmitting"
            @click="submitEditor"
          >
            {{ editSubmitting ? t("common.submitting") : t("common.save") }}
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>
