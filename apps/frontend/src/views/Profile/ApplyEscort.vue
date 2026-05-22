<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import request from "../../utils/request";

interface EscortProfile {
  id: string;
  userId: string;
  idCardNo: string;
  isVerified: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

const router = useRouter();
const { t } = useI18n();
const idCardNo = ref("");
const checkingProfile = ref(true);
const loading = ref(false);

onMounted(() => {
  void checkExistingProfile();
});

async function checkExistingProfile() {
  checkingProfile.value = true;

  try {
    const profile = await request.get<unknown, EscortProfile | null>(
      "/escort-profile/my",
    );

    if (profile) {
      alert(t("applyEscort.alreadyApplied"));
      router.replace("/");
    }
  } finally {
    checkingProfile.value = false;
  }
}

async function handleSubmit() {
  if (!idCardPattern.test(idCardNo.value)) {
    alert(t("applyEscort.invalidIdCard"));
    return;
  }

  loading.value = true;

  try {
    await request.post("/escort-profile/apply", {
      idCardNo: idCardNo.value,
    });

    alert(t("applyEscort.submitSuccess"));
    router.replace("/");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="apply-page">
    <PageHeader :eyebrow="t('applyEscort.eyebrow')" :title="t('applyEscort.title')" width="narrow" />

    <div class="apply-page__body">
      <section class="apply-card">
        <div v-if="checkingProfile" class="apply-status">
          {{ t("applyEscort.checking") }}
        </div>

        <form v-else class="apply-form" @submit.prevent="handleSubmit">
          <label class="apply-field">
            <span class="apply-field__label">
              {{ t("applyEscort.idCardLabel") }}
            </span>
            <input
              v-model="idCardNo"
              type="text"
              maxlength="18"
              autocomplete="off"
              :placeholder="t('applyEscort.idCardPlaceholder')"
              class="apply-field__input"
            />
          </label>

          <button
            type="submit"
            :disabled="loading"
            class="apply-submit"
          >
            {{ loading ? t("applyEscort.submitting") : t("applyEscort.submit") }}
          </button>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.apply-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.apply-page__body {
  @apply flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-10;
}

.apply-card {
  @apply w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70;
}

.apply-status {
  @apply rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-500;
}

.apply-form {
  @apply space-y-6;
}

.apply-field {
  @apply block;
}

.apply-field__label {
  @apply mb-2 block text-sm font-medium text-slate-700;
}

.apply-field__input {
  @apply w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.apply-submit {
  @apply w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400;
}
</style>
