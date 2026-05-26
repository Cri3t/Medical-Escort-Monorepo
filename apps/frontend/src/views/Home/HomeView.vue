<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ClipboardCheck, ClipboardList } from "lucide-vue-next";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
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

function goAdminOrders() {
  router.push("/admin/orders");
}
</script>

<template>
  <main class="home-page">
    <PageHeader :eyebrow="t('home.platform')" :title="t('home.pageTitle')">
      <template #actions>
        <UserNav :display-name="displayName" :user="user" />
      </template>
    </PageHeader>

    <section class="home-section">
      <div class="home-section__header">
        <h2 class="home-section__title">
          {{ t("home.sectionTitle") }}
        </h2>
        <p class="home-section__description">
          {{ t("home.sectionDescription") }}
        </p>
      </div>

      <div class="home-card-grid">
        <article class="home-feature-card">
          <div class="home-feature-card__icon home-feature-card__icon--booking">
            +
          </div>
          <h3 class="home-feature-card__title">
            {{ t("home.bookingTitle") }}
          </h3>
          <p class="home-feature-card__description">
            {{ t("home.bookingDescription") }}
          </p>
          <button
            type="button"
            class="home-action home-action--booking"
            @click="goBookEscort"
          >
            {{ t("home.bookingButton") }}
          </button>
        </article>

        <article class="home-feature-card">
          <div class="home-feature-card__icon home-feature-card__icon--orders">
            #
          </div>
          <h3 class="home-feature-card__title">
            {{ t("home.orderTitle") }}
          </h3>
          <p class="home-feature-card__description">
            {{ t("home.orderDescription") }}
          </p>
          <button
            type="button"
            class="home-action home-action--orders"
            @click="goMyOrders"
          >
            {{ t("home.orderButton") }}
          </button>
        </article>

        <article class="home-feature-card">
          <div class="home-feature-card__icon home-feature-card__icon--escort">
            ✓
          </div>
          <h3 class="home-feature-card__title">
            {{ escortCardTitle }}
          </h3>
          <p class="home-feature-card__description">
            {{ escortCardDescription }}
          </p>
          <button
            type="button"
            :disabled="escortActionDisabled"
            class="home-action"
            :class="
              escortActionDisabled
                ? 'home-action--disabled'
                : 'home-action--escort'
            "
            @click="goApplyEscort"
          >
            {{ escortButtonText }}
          </button>
        </article>

        <article
          v-if="isAdmin"
          class="home-feature-card"
        >
          <div class="home-feature-card__icon home-feature-card__icon--admin">
            <ClipboardCheck class="home-feature-card__svg" aria-hidden="true" />
          </div>
          <h3 class="home-feature-card__title">
            {{ t("home.adminReviewTitle") }}
          </h3>
          <p class="home-feature-card__description">
            {{ t("home.adminReviewDescription") }}
          </p>
          <button
            type="button"
            class="home-action home-action--admin"
            @click="goEscortReviews"
          >
            {{ t("home.adminReviewButton") }}
          </button>
        </article>

        <article
          v-if="isAdmin"
          class="home-feature-card"
        >
          <div class="home-feature-card__icon home-feature-card__icon--admin-orders">
            <ClipboardList class="home-feature-card__svg" aria-hidden="true" />
          </div>
          <h3 class="home-feature-card__title">
            {{ t("home.adminOrdersTitle") }}
          </h3>
          <p class="home-feature-card__description">
            {{ t("home.adminOrdersDescription") }}
          </p>
          <button
            type="button"
            class="home-action home-action--admin-orders"
            @click="goAdminOrders"
          >
            {{ t("home.adminOrdersButton") }}
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.home-section {
  @apply mx-auto max-w-6xl px-4 py-10;
}

.home-section__header {
  @apply mb-8;
}

.home-section__title {
  @apply text-xl font-semibold text-slate-950;
}

.home-section__description {
  @apply mt-2 text-sm text-slate-500;
}

.home-card-grid {
  @apply grid gap-5 md:grid-cols-3;
}

.home-feature-card {
  @apply rounded-lg border border-slate-200 bg-white p-6 shadow-sm;
}

.home-feature-card__icon {
  @apply mb-5 flex h-12 w-12 items-center justify-center rounded-lg text-xl;
}

.home-feature-card__icon--booking {
  @apply bg-teal-50 text-teal-700;
}

.home-feature-card__icon--orders {
  @apply bg-orange-50 text-orange-700;
}

.home-feature-card__icon--escort {
  @apply bg-cyan-50 text-cyan-700;
}

.home-feature-card__icon--admin {
  @apply bg-indigo-50 text-indigo-700;
}

.home-feature-card__icon--admin-orders {
  @apply bg-violet-50 text-violet-700;
}

.home-feature-card__svg {
  @apply h-6 w-6;
}

.home-feature-card__title {
  @apply text-lg font-semibold text-slate-950;
}

.home-feature-card__description {
  @apply mt-2 text-sm leading-6 text-slate-500;
}

.home-action {
  @apply mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4;
}

.home-action--booking,
.home-action--escort {
  @apply bg-teal-600 text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 focus:ring-teal-200;
}

.home-action--orders {
  @apply bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 focus:ring-orange-200;
}

.home-action--admin {
  @apply bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 focus:ring-indigo-200;
}

.home-action--admin-orders {
  @apply bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 focus:ring-violet-200;
}

.home-action--disabled {
  @apply cursor-not-allowed bg-slate-200 text-slate-500;
}
</style>
