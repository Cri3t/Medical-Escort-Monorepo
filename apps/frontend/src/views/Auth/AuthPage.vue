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
  <main class="auth-page">
    <div class="auth-page__language">
      <LanguageSwitcher />
    </div>

    <section class="auth-card">
      <div class="auth-card__header">
        <p class="auth-card__eyebrow">
          {{ t("auth.platform") }}
        </p>
        <h1 class="auth-card__title">
          {{ t("auth.title") }}
        </h1>
      </div>

      <div
        class="auth-tabs"
        role="tablist"
        :aria-label="t('auth.authMethod')"
      >
        <button
          type="button"
          class="auth-tabs__button"
          :class="
            authMode === 'login'
              ? 'auth-tabs__button--active'
              : 'auth-tabs__button--inactive'
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
          class="auth-tabs__button"
          :class="
            authMode === 'register'
              ? 'auth-tabs__button--active'
              : 'auth-tabs__button--inactive'
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
        enter-active-class="auth-transition-enter-active"
        enter-from-class="auth-transition-enter-from"
        enter-to-class="auth-transition-enter-to"
        leave-active-class="auth-transition-leave-active"
        leave-from-class="auth-transition-leave-from"
        leave-to-class="auth-transition-leave-to"
      >
        <form
          v-if="authMode === 'login'"
          key="login"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <label class="auth-field">
            <span class="auth-field__label"
              >{{ t("auth.phone") }}</span
            >
            <input
              v-model="loginForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              :placeholder="t('auth.phonePlaceholder')"
              class="auth-field__input"
            />
          </label>

          <label class="auth-field">
            <span class="auth-field__label"
              >{{ t("auth.password") }}</span
            >
            <input
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              :placeholder="t('auth.passwordPlaceholder')"
              class="auth-field__input"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="auth-submit"
          >
            {{ isLoading ? t("auth.loggingIn") : t("auth.login") }}
          </button>
        </form>

        <form
          v-else
          key="register"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <label class="auth-field">
            <span class="auth-field__label"
              >{{ t("auth.phone") }}</span
            >
            <input
              v-model="registerForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              :placeholder="t('auth.phonePlaceholder')"
              class="auth-field__input"
            />
          </label>

          <label class="auth-field">
            <span class="auth-field__label"
              >{{ t("auth.password") }}</span
            >
            <input
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.passwordPlaceholder')"
              class="auth-field__input"
            />
          </label>

          <label class="auth-field">
            <span class="auth-field__label"
              >{{ t("auth.confirmPassword") }}</span
            >
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              :placeholder="t('auth.confirmPasswordPlaceholder')"
              class="auth-field__input"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="auth-submit"
          >
            {{ isLoading ? t("auth.registering") : t("auth.register") }}
          </button>
        </form>
      </Transition>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  @apply relative flex min-h-screen items-center justify-center px-4 py-10 text-slate-900;
  background-image:
    radial-gradient(circle at top left, #dff7f2, transparent 34%),
    linear-gradient(135deg, #f7fbff 0%, #eef6f7 46%, #f8fafc 100%);
}

.auth-page__language {
  @apply absolute right-4 top-4;
}

.auth-card {
  @apply w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-8 shadow-auth backdrop-blur;
}

.auth-card__header {
  @apply mb-8 text-center;
}

.auth-card__eyebrow {
  @apply mb-3 text-sm font-medium text-teal-700;
}

.auth-card__title {
  @apply text-3xl font-semibold tracking-normal text-slate-950;
}

.auth-tabs {
  @apply mb-8 grid grid-cols-2 rounded-lg bg-slate-100 p-1;
}

.auth-tabs__button {
  @apply rounded-md px-4 py-2.5 text-sm font-medium transition;
}

.auth-tabs__button--active {
  @apply bg-white text-teal-700 shadow-sm;
}

.auth-tabs__button--inactive {
  @apply text-slate-500 hover:text-slate-900;
}

.auth-transition-enter-active {
  @apply transition duration-200 ease-out;
}

.auth-transition-enter-from,
.auth-transition-leave-to {
  @apply translate-y-2 opacity-0;
}

.auth-transition-enter-to,
.auth-transition-leave-from {
  @apply translate-y-0 opacity-100;
}

.auth-transition-leave-active {
  @apply transition duration-150 ease-in;
}

.auth-transition-leave-to {
  @apply -translate-y-2;
}

.auth-form {
  @apply space-y-5;
}

.auth-field {
  @apply block;
}

.auth-field__label {
  @apply mb-2 block text-sm font-medium text-slate-700;
}

.auth-field__input {
  @apply w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.auth-submit {
  @apply w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400;
}
</style>
