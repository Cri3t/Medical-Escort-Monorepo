<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck, X } from "lucide-vue-next";
import {
  getPendingEscortProfiles,
  reviewEscortProfile,
  type PendingEscortProfile,
} from "@/api/admin";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import UserNav from "@/components/UserNav.vue";
import { Button } from "@/components/ui/button";

interface StoredUser {
  nickname?: string;
  phone?: string;
  role?: string;
}

const page = ref(1);
const pageSize = 10;
const total = ref(0);
const list = ref<PendingEscortProfile[]>([]);
const loading = ref(false);
const actionLoadingId = ref("");
const rejectDialogOpen = ref(false);
const rejectTarget = ref<PendingEscortProfile | null>(null);
const rejectionReason = ref("");
const rejectionError = ref("");
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
    return t("admin.userFallback");
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));

onMounted(() => {
  void loadPendingProfiles();
});

async function loadPendingProfiles() {
  loading.value = true;

  try {
    const data = await getPendingEscortProfiles({
      page: page.value,
      pageSize,
    });
    list.value = data.list;
    total.value = data.total;
    page.value = data.page;
  } finally {
    loading.value = false;
  }
}

function maskIdCard(idCardNo: string) {
  if (idCardNo.length <= 10) {
    return idCardNo;
  }

  return `${idCardNo.slice(0, 6)}********${idCardNo.slice(-4)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(intlLocale.value, {
    hour12: false,
  });
}

async function approveProfile(profile: PendingEscortProfile) {
  actionLoadingId.value = profile.id;

  try {
    await reviewEscortProfile(profile.id, {
      action: "APPROVE",
      reason: "",
    });
    alert(t("admin.approveSuccess"));
    await loadPendingProfiles();
  } finally {
    actionLoadingId.value = "";
  }
}

function openRejectDialog(profile: PendingEscortProfile) {
  rejectTarget.value = profile;
  rejectionReason.value = "";
  rejectionError.value = "";
  rejectDialogOpen.value = true;
}

function closeRejectDialog() {
  if (actionLoadingId.value) {
    return;
  }

  rejectDialogOpen.value = false;
  rejectTarget.value = null;
  rejectionReason.value = "";
  rejectionError.value = "";
}

async function submitReject() {
  const reason = rejectionReason.value.trim();

  if (!reason) {
    rejectionError.value = t("admin.rejectReasonRequired");
    return;
  }

  if (!rejectTarget.value) {
    return;
  }

  actionLoadingId.value = rejectTarget.value.id;

  try {
    await reviewEscortProfile(rejectTarget.value.id, {
      action: "REJECT",
      reason,
    });
    alert(t("admin.rejectSuccess"));
    rejectDialogOpen.value = false;
    rejectTarget.value = null;
    rejectionReason.value = "";
    rejectionError.value = "";
    await loadPendingProfiles();
  } finally {
    actionLoadingId.value = "";
  }
}

async function changePage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) {
    return;
  }

  page.value = nextPage;
  await loadPendingProfiles();
}
</script>

<template>
  <main class="admin-page">
    <PageHeader :eyebrow="t('admin.console')" :title="t('admin.title')">
      <template #actions>
        <UserNav :display-name="displayName" :user="user" />
      </template>
    </PageHeader>

    <section class="admin-content">
      <div class="admin-toolbar">
        <div>
          <h2 class="admin-toolbar__title">{{ t("admin.pendingTitle") }}</h2>
          <p class="admin-toolbar__description">
            {{ t("admin.pendingTotal", { total }) }}
          </p>
        </div>
        <Button variant="outline" :disabled="loading" @click="loadPendingProfiles">
          <Loader2 v-if="loading" class="admin-icon admin-icon--spin" aria-hidden="true" />
          <ShieldCheck v-else class="admin-icon" aria-hidden="true" />
          <span>{{ t("admin.refresh") }}</span>
        </Button>
      </div>

      <div class="admin-table-card">
        <div v-if="loading" class="admin-loading">
          <Loader2 class="admin-icon admin-icon--spin" aria-hidden="true" />
          <span>{{ t("admin.loading") }}</span>
        </div>

        <div v-else-if="list.length === 0" class="admin-empty">
          {{ t("admin.empty") }}
        </div>

        <div v-else class="admin-table-scroll">
          <table class="admin-table">
            <thead class="admin-table__head">
              <tr>
                <th class="admin-table__header-cell">{{ t("admin.nickname") }}</th>
                <th class="admin-table__header-cell">{{ t("admin.phone") }}</th>
                <th class="admin-table__header-cell">{{ t("admin.idCard") }}</th>
                <th class="admin-table__header-cell">{{ t("admin.appliedAt") }}</th>
                <th class="admin-table__header-cell">{{ t("admin.actions") }}</th>
              </tr>
            </thead>
            <tbody class="admin-table__body">
              <tr v-for="profile in list" :key="profile.id" class="admin-table__row">
                <td class="admin-table__name-cell">
                  {{ profile.user.nickname || t("admin.nicknameFallback") }}
                </td>
                <td class="admin-table__cell">{{ profile.user.phone }}</td>
                <td class="admin-table__id-cell">
                  {{ maskIdCard(profile.idCardNo) }}
                </td>
                <td class="admin-table__cell">
                  {{ formatDate(profile.createdAt) }}
                </td>
                <td class="admin-table__action-cell">
                  <div class="admin-table__actions">
                    <Button
                      size="sm"
                      class="admin-approve-button"
                      :disabled="Boolean(actionLoadingId)"
                      @click="approveProfile(profile)"
                    >
                      <Loader2
                        v-if="actionLoadingId === profile.id"
                        class="admin-icon admin-icon--spin"
                        aria-hidden="true"
                      />
                      <Check v-else class="admin-icon" aria-hidden="true" />
                      <span>{{ t("admin.approve") }}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      class="admin-reject-button"
                      :disabled="Boolean(actionLoadingId)"
                      @click="openRejectDialog(profile)"
                    >
                      <X class="admin-icon" aria-hidden="true" />
                      <span>{{ t("admin.reject") }}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="admin-pagination">
        <span>{{ t("admin.pageInfo", { page, totalPages }) }}</span>
        <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
          <ChevronLeft class="admin-icon" aria-hidden="true" />
          <span>{{ t("admin.previousPage") }}</span>
        </Button>
        <Button variant="outline" size="sm" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">
          <span>{{ t("admin.nextPage") }}</span>
          <ChevronRight class="admin-icon" aria-hidden="true" />
        </Button>
      </div>
    </section>

    <div
      v-if="rejectDialogOpen"
      class="admin-dialog-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section class="admin-dialog">
        <div class="admin-dialog__header">
          <h2 class="admin-dialog__title">{{ t("admin.rejectTitle") }}</h2>
          <p class="admin-dialog__description">
            {{ t("admin.rejectDescription") }}
          </p>
        </div>

        <label class="admin-field">
          <span class="admin-field__label">{{ t("admin.rejectReason") }}</span>
          <textarea
            v-model="rejectionReason"
            rows="4"
            class="admin-field__textarea"
            :placeholder="t('admin.rejectReasonPlaceholder')"
            @input="rejectionError = ''"
          />
        </label>
        <p v-if="rejectionError" class="admin-field__error">
          {{ rejectionError }}
        </p>

        <div class="admin-dialog__actions">
          <Button variant="outline" :disabled="Boolean(actionLoadingId)" @click="closeRejectDialog">
            {{ t("common.cancel") }}
          </Button>
          <Button class="admin-confirm-reject-button" :disabled="Boolean(actionLoadingId)" @click="submitReject">
            <Loader2 v-if="actionLoadingId" class="admin-icon admin-icon--spin" aria-hidden="true" />
            <span>{{ t("admin.confirmReject") }}</span>
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.admin-content {
  @apply mx-auto max-w-6xl px-4 py-10;
}

.admin-toolbar {
  @apply mb-6 flex flex-wrap items-end justify-between gap-4;
}

.admin-toolbar__title {
  @apply text-xl font-semibold text-slate-950;
}

.admin-toolbar__description {
  @apply mt-2 text-sm text-slate-500;
}

.admin-icon {
  @apply h-4 w-4;
}

.admin-icon--spin {
  @apply animate-spin;
}

.admin-table-card {
  @apply overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm;
}

.admin-loading {
  @apply flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500;
}

.admin-empty {
  @apply px-4 py-16 text-center text-sm text-slate-500;
}

.admin-table-scroll {
  @apply overflow-x-auto;
}

.admin-table {
  @apply w-full min-w-[760px] border-collapse text-left text-sm;
}

.admin-table__head {
  @apply bg-slate-50 text-xs uppercase tracking-normal text-slate-500;
}

.admin-table__header-cell {
  @apply px-5 py-3 font-medium;
}

.admin-table__body {
  @apply divide-y divide-slate-200;
}

.admin-table__row {
  @apply hover:bg-slate-50/70;
}

.admin-table__cell {
  @apply px-5 py-4 text-slate-600;
}

.admin-table__name-cell {
  @apply px-5 py-4 font-medium text-slate-950;
}

.admin-table__id-cell {
  @apply px-5 py-4 font-mono text-slate-600;
}

.admin-table__action-cell {
  @apply px-5 py-4;
}

.admin-table__actions {
  @apply flex gap-2;
}

.admin-approve-button {
  @apply bg-teal-600 text-white hover:bg-teal-700;
}

.admin-reject-button {
  @apply border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700;
}

.admin-pagination {
  @apply mt-5 flex items-center justify-end gap-3 text-sm text-slate-500;
}

.admin-dialog-backdrop {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4;
}

.admin-dialog {
  @apply w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl;
}

.admin-dialog__header {
  @apply mb-5;
}

.admin-dialog__title {
  @apply text-lg font-semibold text-slate-950;
}

.admin-dialog__description {
  @apply mt-2 text-sm text-slate-500;
}

.admin-field {
  @apply block;
}

.admin-field__label {
  @apply mb-2 block text-sm font-medium text-slate-700;
}

.admin-field__textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.admin-field__error {
  @apply mt-2 text-sm text-red-600;
}

.admin-dialog__actions {
  @apply mt-6 flex justify-end gap-3;
}

.admin-confirm-reject-button {
  @apply bg-red-600 text-white hover:bg-red-700;
}
</style>
