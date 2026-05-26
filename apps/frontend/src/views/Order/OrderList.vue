<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getPublicProfiles } from "@/api/escort";
import type { PublicEscortProfile } from "@/api/escort";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import UserNav from "@/components/UserNav.vue";
import { Button } from "@/components/ui/button";
import {
  acceptOrder,
  cancelOrder,
  completeOrder,
  getMyOrders,
  payOrder,
  reassignOrder,
  rejectOrder,
  userUpdateOrder,
} from "@/api/order";
import type { Order, OrderStatus, UserUpdateOrderPayload } from "@/api/order";
import { ORDER_LIST_REFRESH_EVENT } from "@/realtime/orders";

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

type OrderAction = "pay" | "cancel" | "accept" | "complete" | "reject";
type EditMode = "remark" | "amount";

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

const orders = ref<Order[]>([]);
const loading = ref(false);
const actionLoadingKey = ref("");
const editingOrder = ref<Order | null>(null);
const editMode = ref<EditMode | null>(null);
const remarkInput = ref("");
const amountInput = ref<string | number>("");
const editSubmitting = ref(false);
const reassigningOrder = ref<Order | null>(null);
const availableEscorts = ref<PublicEscortProfile[]>([]);
const selectedEscortId = ref("");
const reassignLoading = ref(false);
const reassignSubmitting = ref(false);
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
  window.addEventListener(ORDER_LIST_REFRESH_EVENT, handleRealtimeRefresh);
  void fetchOrders();
});

onBeforeUnmount(() => {
  window.removeEventListener(ORDER_LIST_REFRESH_EVENT, handleRealtimeRefresh);
});

function handleRealtimeRefresh() {
  void fetchOrders();
}

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
  return actionLoadingKey.value !== "" || editSubmitting.value || reassignSubmitting.value;
}

function canPay(order: Order) {
  return user.value.role === "USER" && order.status === "PENDING_PAYMENT";
}

function canCancel(order: Order) {
  return (
    user.value.role === "USER" &&
    (order.status === "PENDING_PAYMENT" || order.status === "PENDING_ACCEPT")
  );
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

function canReassign(order: Order) {
  return (
    user.value.role === "USER" &&
    order.status === "PENDING_ACCEPT" &&
    order.escortId === null
  );
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
    canCancel(order) ||
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

  const rawAmount = String(amountInput.value).trim();
  const amount = Number(rawAmount);

  if (
    rawAmount === "" ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !/^\d+(\.\d{1,2})?$/.test(rawAmount)
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

async function openReassignDialog(order: Order) {
  if (isAnyActionLoading()) {
    return;
  }

  reassigningOrder.value = order;
  selectedEscortId.value = "";
  reassignLoading.value = true;

  try {
    availableEscorts.value = await getPublicProfiles();
  } catch {
    // The request interceptor already displays backend error messages.
    closeReassignDialogAfterSubmit();
  } finally {
    reassignLoading.value = false;
  }
}

function closeReassignDialog() {
  if (reassignLoading.value || reassignSubmitting.value) {
    return;
  }

  reassigningOrder.value = null;
  availableEscorts.value = [];
  selectedEscortId.value = "";
}

function closeReassignDialogAfterSubmit() {
  reassigningOrder.value = null;
  availableEscorts.value = [];
  selectedEscortId.value = "";
}

async function submitReassignment() {
  if (!reassigningOrder.value || reassignSubmitting.value) {
    return;
  }

  if (!selectedEscortId.value) {
    alert(t("orders.reassignSelectRequired"));
    return;
  }

  reassignSubmitting.value = true;

  try {
    await reassignOrder(reassigningOrder.value.id, {
      escortId: selectedEscortId.value,
    });
    alert(t("orders.reassignSuccess"));
    closeReassignDialogAfterSubmit();
    await fetchOrders();
  } catch {
    // The request interceptor already displays backend error messages.
  } finally {
    reassignSubmitting.value = false;
  }
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

async function handleCancel(order: Order) {
  const confirmed = window.confirm(t("orders.cancelConfirm"));

  if (!confirmed) {
    return;
  }

  await runOrderAction(order, "cancel", cancelOrder, t("orders.cancelSuccess"));
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
  <main class="orders-page">
    <PageHeader :title="t('orders.title')" width="narrow">
      <template #actions>
        <UserNav :display-name="displayName" :user="user" />
      </template>
    </PageHeader>

    <section class="orders-content">
      <div v-if="loading" class="orders-list">
        <article
          v-for="index in 3"
          :key="index"
          class="order-skeleton-card"
        >
          <div class="order-skeleton-card__title"></div>
          <div class="order-skeleton-card__line"></div>
          <div class="order-skeleton-card__short-line"></div>
        </article>
      </div>

      <div
        v-else-if="orders.length === 0"
        class="orders-empty"
      >
        <p class="orders-empty__title">{{ t("orders.emptyTitle") }}</p>
        <p class="orders-empty__description">
          {{ t("orders.emptyDescription") }}
        </p>
      </div>

      <div v-else class="orders-list">
        <article
          v-for="order in orders"
          :key="order.id"
          class="order-card"
        >
          <div class="order-card__header">
            <div class="order-card__identity">
              <p class="order-card__label">{{ t("orders.orderNo") }}</p>
              <h2 class="order-card__number">
                {{ order.orderNo }}
              </h2>
              <p class="order-card__created-time">
                {{ t("orders.createdAt", { time: formatDateTime(order.createdAt) }) }}
              </p>
            </div>
            <span
              class="order-status"
              :class="getStatusMeta(order.status).className"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>

          <dl class="order-details">
            <div>
              <dt class="order-details__label">{{ t("orders.escort") }}</dt>
              <dd class="order-details__value">
                {{ order.escort?.nickname || t("orders.waitingAccept") }}
              </dd>
            </div>
            <div>
              <dt class="order-details__label">{{ t("orders.amount") }}</dt>
              <dd class="order-details__amount">
                {{ formatAmount(order.amount) }}
              </dd>
            </div>
            <div>
              <dt class="order-details__label">{{ t("orders.hospitalName") }}</dt>
              <dd class="order-details__value">
                {{ order.hospitalName }}
              </dd>
            </div>
            <div>
              <dt class="order-details__label">{{ t("orders.serviceAt") }}</dt>
              <dd class="order-details__value">
                {{ formatDateTime(order.serviceAt) }}
              </dd>
            </div>
            <div class="order-details__full-row">
              <dt class="order-details__label">{{ t("orders.remark") }}</dt>
              <dd class="order-details__remark">
                {{ order.remark || t("orders.noRemark") }}
              </dd>
            </div>
          </dl>

          <div
            v-if="hasVisibleActions(order)"
            class="order-card__actions"
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
              v-if="canReassign(order)"
              type="button"
              class="order-action-button--reassign"
              :disabled="isAnyActionLoading()"
              @click="openReassignDialog(order)"
            >
              {{ t("orders.reassign") }}
            </Button>
            <Button
              v-if="canPay(order)"
              type="button"
              class="order-action-button--pay"
              :disabled="isAnyActionLoading()"
              @click="handlePay(order)"
            >
              {{ isActionLoading(order, "pay") ? t("orders.paying") : t("orders.pay") }}
            </Button>
            <Button
              v-if="canCancel(order)"
              type="button"
              variant="destructive"
              :disabled="isAnyActionLoading()"
              @click="handleCancel(order)"
            >
              {{
                isActionLoading(order, "cancel")
                  ? t("orders.cancelling")
                  : t("orders.cancel")
              }}
            </Button>
            <Button
              v-if="canAccept(order)"
              type="button"
              class="order-action-button--accept"
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
              class="order-action-button--complete"
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
      class="order-editor-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section class="order-editor">
        <div class="order-editor__header">
          <div>
            <h2 class="order-editor__title">
              {{ editTitle }}
            </h2>
            <p class="order-editor__order-no">
              {{ editingOrder.orderNo }}
            </p>
          </div>
          <button
            type="button"
            class="order-editor__close"
            :disabled="editSubmitting"
            @click="closeEditor"
          >
            {{ t("common.close") }}
          </button>
        </div>

        <div class="order-editor__body">
          <label
            v-if="editMode === 'remark'"
            class="order-editor__field"
          >
            {{ t("orders.remark") }}
            <textarea
              v-model="remarkInput"
              class="order-editor__textarea"
              :placeholder="t('orders.remarkPlaceholder')"
            ></textarea>
          </label>

          <label
            v-else
            class="order-editor__field"
          >
            {{ t("orders.amount") }}
            <input
              v-model="amountInput"
              type="number"
              min="0"
              step="0.01"
              class="order-editor__input"
              :placeholder="t('orders.amountPlaceholder')"
            />
          </label>
        </div>

        <div class="order-editor__actions">
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
            class="order-editor__save"
            :disabled="editSubmitting"
            @click="submitEditor"
          >
            {{ editSubmitting ? t("common.submitting") : t("common.save") }}
          </Button>
        </div>
      </section>
    </div>

    <div
      v-if="reassigningOrder"
      class="order-editor-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section class="order-editor">
        <div class="order-editor__header">
          <div>
            <h2 class="order-editor__title">{{ t("orders.reassignTitle") }}</h2>
            <p class="order-editor__order-no">{{ reassigningOrder.orderNo }}</p>
          </div>
          <button
            type="button"
            class="order-editor__close"
            :disabled="reassignLoading || reassignSubmitting"
            @click="closeReassignDialog"
          >
            {{ t("common.close") }}
          </button>
        </div>

        <p class="order-editor__description">{{ t("orders.reassignDescription") }}</p>
        <div v-if="reassignLoading" class="order-editor__empty">
          {{ t("orders.loadingEscorts") }}
        </div>
        <div v-else-if="availableEscorts.length === 0" class="order-editor__empty">
          {{ t("orders.noAvailableEscorts") }}
        </div>
        <label v-else class="order-editor__field order-editor__field--spaced">
          {{ t("orders.selectEscort") }}
          <select v-model="selectedEscortId" class="order-editor__select">
            <option disabled value="">{{ t("orders.selectEscortPlaceholder") }}</option>
            <option
              v-for="escort in availableEscorts"
              :key="escort.userId"
              :value="escort.userId"
            >
              {{ escort.user.nickname || t("book.unnamedEscort") }}
            </option>
          </select>
        </label>

        <div class="order-editor__actions">
          <Button
            type="button"
            variant="outline"
            :disabled="reassignLoading || reassignSubmitting"
            @click="closeReassignDialog"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            type="button"
            class="order-editor__save"
            :disabled="reassignLoading || reassignSubmitting || availableEscorts.length === 0"
            @click="submitReassignment"
          >
            {{ reassignSubmitting ? t("orders.reassigning") : t("orders.confirmReassign") }}
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.orders-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.orders-content {
  @apply container mx-auto max-w-4xl px-4 py-8;
}

.orders-list {
  @apply space-y-4;
}

.order-skeleton-card {
  @apply animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm;
}

.order-skeleton-card__title {
  @apply h-5 w-48 rounded bg-slate-200;
}

.order-skeleton-card__line {
  @apply mt-6 h-4 w-full rounded bg-slate-100;
}

.order-skeleton-card__short-line {
  @apply mt-3 h-4 w-2/3 rounded bg-slate-100;
}

.orders-empty {
  @apply rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center;
}

.orders-empty__title {
  @apply text-base font-medium text-slate-700;
}

.orders-empty__description {
  @apply mt-2 text-sm text-slate-500;
}

.order-card {
  @apply rounded-lg border border-slate-200 bg-white p-6 shadow-sm;
}

.order-card__header {
  @apply flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between;
}

.order-card__identity {
  @apply min-w-0;
}

.order-card__label,
.order-card__created-time,
.order-details__label {
  @apply text-sm text-slate-500;
}

.order-card__number {
  @apply mt-1 break-all text-lg font-semibold text-slate-950;
}

.order-card__created-time {
  @apply mt-2;
}

.order-status {
  @apply inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ring-1;
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

.order-details {
  @apply grid gap-4 py-5 sm:grid-cols-2;
}

.order-details__value {
  @apply mt-1 text-base font-medium text-slate-900;
}

.order-details__amount {
  @apply mt-1 text-base font-semibold text-slate-950;
}

.order-details__full-row {
  @apply sm:col-span-2;
}

.order-details__remark {
  @apply mt-1 whitespace-pre-wrap break-words text-base text-slate-900;
}

.order-card__actions {
  @apply flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4;
}

.order-action-button--pay {
  @apply bg-orange-600 hover:bg-orange-700;
}

.order-action-button--accept {
  @apply bg-sky-600 hover:bg-sky-700;
}

.order-action-button--complete {
  @apply bg-green-600 hover:bg-green-700;
}

.order-action-button--reassign {
  @apply bg-teal-600 hover:bg-teal-700;
}

.order-editor-backdrop {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6;
}

.order-editor {
  @apply w-full max-w-md rounded-lg bg-white p-6 shadow-xl;
}

.order-editor__header {
  @apply flex items-start justify-between gap-4;
}

.order-editor__title {
  @apply text-lg font-semibold text-slate-950;
}

.order-editor__order-no {
  @apply mt-1 break-all text-sm text-slate-500;
}

.order-editor__close {
  @apply rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900;
}

.order-editor__body {
  @apply mt-5;
}

.order-editor__description {
  @apply mt-4 text-sm text-slate-600;
}

.order-editor__empty {
  @apply mt-5 rounded-md bg-slate-50 px-4 py-5 text-center text-sm text-slate-500;
}

.order-editor__field {
  @apply block text-sm font-medium text-slate-700;
}

.order-editor__field--spaced {
  @apply mt-5;
}

.order-editor__textarea {
  @apply mt-2 min-h-32 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.order-editor__input {
  @apply mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.order-editor__select {
  @apply mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.order-editor__actions {
  @apply mt-6 flex justify-end gap-3;
}

.order-editor__save {
  @apply bg-teal-600 hover:bg-teal-700;
}
</style>
