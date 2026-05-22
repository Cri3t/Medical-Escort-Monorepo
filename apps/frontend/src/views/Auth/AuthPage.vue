<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";
import request from "../../utils/request";

type AuthMode = "login" | "register";

interface AuthUser {
  id?: string;
  phone?: string;
  nickname?: string;
  role?: string;
}

interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

const router = useRouter();
const { t } = useI18n();
const phonePattern = /^1[3-9]\d{9}$/;

const authMode = ref<AuthMode>("login");
const isLoading = ref(false);

const loginForm = ref({
  phone: "",
  password: "",
});

const registerForm = ref({
  phone: "",
  password: "",
  confirmPassword: "",
});

function switchMode(mode: AuthMode) {
  authMode.value = mode;
}

function isValidPhone(phone: string) {
  return phonePattern.test(phone);
}

async function handleLogin() {
  if (!isValidPhone(loginForm.value.phone)) {
    alert(t("auth.invalidPhone"));
    return;
  }

  isLoading.value = true;

  try {
    const data = await request.post<unknown, AuthResult>("/auth/login", {
      phone: loginForm.value.phone,
      password: loginForm.value.password,
    });

    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert(t("auth.loginSuccess"));
    router.push("/");
  } finally {
    isLoading.value = false;
  }
}

async function handleRegister() {
  if (!isValidPhone(registerForm.value.phone)) {
    alert(t("auth.invalidPhone"));
    return;
  }

  isLoading.value = true;

  try {
    await request.post("/auth/register", {
      phone: registerForm.value.phone,
      password: registerForm.value.password,
    });

    authMode.value = "login";
    registerForm.value.phone = "";
    registerForm.value.password = "";
    registerForm.value.confirmPassword = "";
    alert(t("auth.registerSuccess"));
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main
    class="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#dff7f2,_transparent_34%),linear-gradient(135deg,_#f7fbff_0%,_#eef6f7_46%,_#f8fafc_100%)] px-4 py-10 text-slate-900"
  >
    <div class="absolute right-4 top-4">
      <LanguageSwitcher />
    </div>

    <section
      class="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-8 shadow-auth backdrop-blur"
    >
      <div class="mb-8 text-center">
        <p class="mb-3 text-sm font-medium text-teal-700">
          {{ t("auth.platform") }}
        </p>
        <h1 class="text-3xl font-semibold tracking-normal text-slate-950">
          {{ t("auth.title") }}
        </h1>
      </div>

      <div
        class="mb-8 grid grid-cols-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
        :aria-label="t('auth.authMethod')"
      >
        <button
          type="button"
          class="rounded-md px-4 py-2.5 text-sm font-medium transition"
          :class="
            authMode === 'login'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          "
          role="tab"
          :aria-selected="authMode === 'login'"
          :disabled="isLoading"
          @click="switchMode('login')"
        >
          {{ t("auth.login") }}
        </button>
        <button
          type="button"
          class="rounded-md px-4 py-2.5 text-sm font-medium transition"
          :class="
            authMode === 'register'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          "
          role="tab"
          :aria-selected="authMode === 'register'"
          :disabled="isLoading"
          @click="switchMode('register')"
        >
          {{ t("auth.register") }}
        </button>
      </div>

      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <form
          v-if="authMode === 'login'"
          key="login"
          class="space-y-5"
          @submit.prevent="handleLogin"
        >
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >{{ t("auth.phone") }}</span
            >
            <input
              v-model="loginForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              :placeholder="t('auth.phonePlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >{{ t("auth.password") }}</span
            >
            <input
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              :placeholder="t('auth.passwordPlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {{ isLoading ? t("auth.loggingIn") : t("auth.login") }}
          </button>
        </form>

        <form
          v-else
          key="register"
          class="space-y-5"
          @submit.prevent="handleRegister"
        >
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >{{ t("auth.phone") }}</span
            >
            <input
              v-model="registerForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              :placeholder="t('auth.phonePlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >{{ t("auth.password") }}</span
            >
            <input
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.passwordPlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >{{ t("auth.confirmPassword") }}</span
            >
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {{ isLoading ? t("auth.registering") : t("auth.register") }}
          </button>
        </form>
      </Transition>
    </section>
  </main>
</template>
