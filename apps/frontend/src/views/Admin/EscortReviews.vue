<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck, X } from "lucide-vue-next";
import {
  getPendingEscortProfiles,
  reviewEscortProfile,
  type PendingEscortProfile,
} from "@/api/admin";
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
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <div>
          <p class="text-sm font-medium text-teal-700">{{ t("admin.console") }}</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
            {{ t("admin.title") }}
          </h1>
        </div>
        <UserNav :display-name="displayName" :user="user" />
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 py-10">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-950">{{ t("admin.pendingTitle") }}</h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ t("admin.pendingTotal", { total }) }}
          </p>
        </div>
        <Button variant="outline" :disabled="loading" @click="loadPendingProfiles">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true" />
          <ShieldCheck v-else class="h-4 w-4" aria-hidden="true" />
          <span>{{ t("admin.refresh") }}</span>
        </Button>
      </div>

      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div v-if="loading" class="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500">
          <Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>{{ t("admin.loading") }}</span>
        </div>

        <div v-else-if="list.length === 0" class="px-4 py-16 text-center text-sm text-slate-500">
          {{ t("admin.empty") }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-normal text-slate-500">
              <tr>
                <th class="px-5 py-3 font-medium">{{ t("admin.nickname") }}</th>
                <th class="px-5 py-3 font-medium">{{ t("admin.phone") }}</th>
                <th class="px-5 py-3 font-medium">{{ t("admin.idCard") }}</th>
                <th class="px-5 py-3 font-medium">{{ t("admin.appliedAt") }}</th>
                <th class="px-5 py-3 font-medium">{{ t("admin.actions") }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-for="profile in list" :key="profile.id" class="hover:bg-slate-50/70">
                <td class="px-5 py-4 font-medium text-slate-950">
                  {{ profile.user.nickname || t("admin.nicknameFallback") }}
                </td>
                <td class="px-5 py-4 text-slate-600">{{ profile.user.phone }}</td>
                <td class="px-5 py-4 font-mono text-slate-600">
                  {{ maskIdCard(profile.idCardNo) }}
                </td>
                <td class="px-5 py-4 text-slate-600">
                  {{ formatDate(profile.createdAt) }}
                </td>
                <td class="px-5 py-4">
                  <div class="flex gap-2">
                    <Button
                      size="sm"
                      class="bg-teal-600 text-white hover:bg-teal-700"
                      :disabled="Boolean(actionLoadingId)"
                      @click="approveProfile(profile)"
                    >
                      <Loader2
                        v-if="actionLoadingId === profile.id"
                        class="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <Check v-else class="h-4 w-4" aria-hidden="true" />
                      <span>{{ t("admin.approve") }}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      :disabled="Boolean(actionLoadingId)"
                      @click="openRejectDialog(profile)"
                    >
                      <X class="h-4 w-4" aria-hidden="true" />
                      <span>{{ t("admin.reject") }}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-5 flex items-center justify-end gap-3 text-sm text-slate-500">
        <span>{{ t("admin.pageInfo", { page, totalPages }) }}</span>
        <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="changePage(page - 1)">
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
          <span>{{ t("admin.previousPage") }}</span>
        </Button>
        <Button variant="outline" size="sm" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">
          <span>{{ t("admin.nextPage") }}</span>
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </section>

    <div
      v-if="rejectDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <section class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <div class="mb-5">
          <h2 class="text-lg font-semibold text-slate-950">{{ t("admin.rejectTitle") }}</h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ t("admin.rejectDescription") }}
          </p>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">{{ t("admin.rejectReason") }}</span>
          <textarea
            v-model="rejectionReason"
            rows="4"
            class="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            :placeholder="t('admin.rejectReasonPlaceholder')"
            @input="rejectionError = ''"
          />
        </label>
        <p v-if="rejectionError" class="mt-2 text-sm text-red-600">
          {{ rejectionError }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <Button variant="outline" :disabled="Boolean(actionLoadingId)" @click="closeRejectDialog">
            {{ t("common.cancel") }}
          </Button>
          <Button class="bg-red-600 text-white hover:bg-red-700" :disabled="Boolean(actionLoadingId)" @click="submitReject">
            <Loader2 v-if="actionLoadingId" class="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{{ t("admin.confirmReject") }}</span>
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>
