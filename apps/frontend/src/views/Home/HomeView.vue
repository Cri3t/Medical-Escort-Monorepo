<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
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
  createdAt: string;
  updatedAt: string;
}

type ProfileStatus = "LOADING" | "NOT_APPLIED" | "PENDING" | "APPROVED";

const copy = {
  userFallback: "User",
  pageTitle: "Medical Escort Service Dashboard",
  sectionTitle: "Service Entry",
  sectionDescription:
    "Manage your medical escort service workflow, submit onboarding applications, and view available platform features.",
  bookingTitle: "Book Escort Service",
  bookingDescription:
    "Submit appointment time, hospital, and service needs. The platform will match you with a suitable escort.",
  comingSoon: "Coming Soon",
};

const router = useRouter();
const profileStatus = ref<ProfileStatus>("LOADING");
const profileLoading = ref(true);

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
    return copy.userFallback;
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const escortCardTitle = computed(() => {
  if (profileLoading.value) {
    return "Escort Onboarding Status";
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return "Escort Dashboard";
  }

  if (profileStatus.value === "PENDING") {
    return "Onboarding Review in Progress...";
  }

  return "Become an Escort";
});

const escortCardDescription = computed(() => {
  if (profileLoading.value) {
    return "Loading your onboarding application status. Please wait.";
  }

  if (profileStatus.value === "PENDING") {
    return "Your escort identity verification has been submitted and is under review.";
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return "Your escort identity has been approved. You can enter the escort dashboard to manage service orders.";
  }

  return "Submit identity verification to apply as an escort. After approval, you can receive service orders.";
});

const escortButtonText = computed(() => {
  if (profileLoading.value) {
    return "Loading Status...";
  }

  if (profileStatus.value === "PENDING") {
    return "Under Review";
  }

  if (profileStatus.value === "APPROVED" || user.value.role === "ESCORT") {
    return "Approved";
  }

  return "Apply Now";
});

const escortActionDisabled = computed(
  () =>
    profileLoading.value ||
    profileStatus.value === "PENDING" ||
    profileStatus.value === "APPROVED" ||
    user.value.role === "ESCORT",
);

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

    profileStatus.value = profile.isVerified ? "APPROVED" : "PENDING";
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
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5"
      >
        <div>
          <p class="text-sm font-medium text-teal-700">
            Medical Escort Platform
          </p>
          <h1
            class="mt-1 text-2xl font-semibold tracking-normal text-slate-950"
          >
            {{ copy.pageTitle }}
          </h1>
        </div>
        <UserNav :display-name="displayName" :user="user" />
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 py-10">
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-950">
          {{ copy.sectionTitle }}
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ copy.sectionDescription }}
        </p>
      </div>

      <div class="grid gap-5 md:grid-cols-2">
        <article
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div
            class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-xl text-teal-700"
          >
            +
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {{ copy.bookingTitle }}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            {{ copy.bookingDescription }}
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
            disabled
          >
            {{ copy.comingSoon }}
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
      </div>
    </section>
  </main>
</template>
