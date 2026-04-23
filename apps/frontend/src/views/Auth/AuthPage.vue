<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
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
    alert("请输入正确的手机号");
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

    alert("登录成功");
    router.push("/");
  } finally {
    isLoading.value = false;
  }
}

async function handleRegister() {
  if (!isValidPhone(registerForm.value.phone)) {
    alert("请输入正确的手机号");
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
    alert("注册成功");
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_#dff7f2,_transparent_34%),linear-gradient(135deg,_#f7fbff_0%,_#eef6f7_46%,_#f8fafc_100%)] px-4 py-10 text-slate-900"
  >
    <section
      class="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-8 shadow-auth backdrop-blur"
    >
      <div class="mb-8 text-center">
        <p class="mb-3 text-sm font-medium text-teal-700">
          Medical Escort Platform
        </p>
        <h1 class="text-3xl font-semibold tracking-normal text-slate-950">
          医疗陪诊系统
        </h1>
      </div>

      <div
        class="mb-8 grid grid-cols-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label="认证方式"
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
          登录
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
          注册
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
              >手机号</span
            >
            <input
              v-model="loginForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              placeholder="请输入 11 位手机号"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >密码</span
            >
            <input
              v-model="loginForm.password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {{ isLoading ? "登录中..." : "登录" }}
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
              >手机号</span
            >
            <input
              v-model="registerForm.phone"
              type="tel"
              autocomplete="tel"
              maxlength="11"
              placeholder="请输入 11 位手机号"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >密码</span
            >
            <input
              v-model="registerForm.password"
              type="password"
              autocomplete="new-password"
              placeholder="请输入密码"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700"
              >确认密码</span
            >
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="请再次输入密码"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400"
          >
            {{ isLoading ? "注册中..." : "注册" }}
          </button>
        </form>
      </Transition>
    </section>
  </main>
</template>
