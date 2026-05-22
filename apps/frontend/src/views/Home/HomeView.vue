<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ClipboardCheck } from "lucide-vue-next";
import { useRouter } from "vue-router";
import UserNav from "@/components/UserNav.vue";
import request from "@/utils/request";

interface StoredUser {
  nickname?: string;
  phone?: string;
  role?: string;
}

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

type ProfileStatus =
  | "LOADING"
  | "NOT_APPLIED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

const router = useRouter();
const { t } = useI18n();
const profileStatus = ref<ProfileStatus>("LOADING");
const profileLoading = ref(true);
const rejectionReason = ref("");

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
    return t("home.userFallback");
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const escortCardTitle = computed(() => {
  if (profileLoading.value) {
    return t("home.escortStatusTitle");
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return t("home.escortDashboardTitle");
  }

  if (profileStatus.value === "PENDING") {
    return t("home.escortPendingTitle");
  }

  if (profileStatus.value === "REJECTED") {
    return t("home.escortRejectedTitle");
  }

  return t("home.becomeEscortTitle");
});

const escortCardDescription = computed(() => {
  if (profileLoading.value) {
    return t("home.escortLoadingDescription");
  }

  if (profileStatus.value === "PENDING") {
    return t("home.escortPendingDescription");
  }

  if (profileStatus.value === "REJECTED") {
    return rejectionReason.value
      ? t("home.escortRejectedReason", { reason: rejectionReason.value })
      : t("home.escortRejectedDescription");
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return t("home.escortApprovedDescription");
  }

  return t("home.becomeEscortDescription");
});

const escortButtonText = computed(() => {
  if (profileLoading.value) {
    return t("home.loadingStatus");
  }

  if (profileStatus.value === "PENDING") {
    return t("home.underReview");
  }

  if (profileStatus.value === "REJECTED") {
    return t("home.rejected");
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return t("home.approved");
  }

  return t("home.applyNow");
});

const escortActionDisabled = computed(
  () =>
    profileLoading.value ||
    profileStatus.value === "PENDING" ||
    profileStatus.value === "REJECTED" ||
    profileStatus.value === "APPROVED" ||
    user.value.role === "ESCORT",
);

const isAdmin = computed(() => user.value.role === "ADMIN");

onMounted(() => {
  void loadMyProfile();
});

async function loadMyProfile() {
  profileLoading.value = true;

  try {
    const profile = await request.get<unknown, EscortProfile | null>(
      "/escort-profile/my",
    );

    if (!profile) {
      profileStatus.value = "NOT_APPLIED";
      return;
    }

    profileStatus.value = profile.status;
    rejectionReason.value = profile.rejectionReason ?? "";
  } catch {
    profileStatus.value = "NOT_APPLIED";
  } finally {
    profileLoading.value = false;
  }
}

function goApplyEscort() {
  if (escortActionDisabled.value) {
    return;
  }

  router.push("/profile/apply");
}

function goBookEscort() {
  router.push("/book");
}

function goMyOrders() {
  router.push("/orders");
}

function goEscortReviews() {
  router.push("/admin/escort-reviews");
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5"
      >
        <div>
          <p class="text-sm font-medium text-teal-700">
            {{ t("home.platform") }}
          </p>
          <h1
            class="mt-1 text-2xl font-semibold tracking-normal text-slate-950"
          >
            {{ t("home.pageTitle") }}
          </h1>
        </div>
        <UserNav :display-name="displayName" :user="user" />
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 py-10">
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-950">
          {{ t("home.sectionTitle") }}
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ t("home.sectionDescription") }}
        </p>
      </div>

      <div class="grid gap-5 md:grid-cols-3">
        <article
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-xl text-teal-700"
          >
            +
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t("home.bookingTitle") }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t("home.bookingDescription") }}
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
            @click="goBookEscort"
          >
            {{ t("home.bookingButton") }}
          </button>
        </article>

        <article
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-xl text-orange-700"
          >
            #
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t("home.orderTitle") }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t("home.orderDescription") }}
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
            @click="goMyOrders"
          >
            {{ t("home.orderButton") }}
          </button>
        </article>

        <article
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-xl text-cyan-700"
          >
            ✓
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {{ escortCardTitle }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ escortCardDescription }}
          </p>
          <button
            type="button"
            :disabled="escortActionDisabled"
            class="mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4"
            :class="
              escortActionDisabled
                ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                : 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 focus:ring-teal-200'
            "
            @click="goApplyEscort"
          >
            {{ escortButtonText }}
          </button>
        </article>

        <article
          v-if="isAdmin"
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-xl text-indigo-700"
          >
            <ClipboardCheck class="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {{ t("home.adminReviewTitle") }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ t("home.adminReviewDescription") }}
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            @click="goEscortReviews"
          >
            {{ t("home.adminReviewButton") }}
          </button>
        </article>
      </div>
    </section>
  </main>
</template>
