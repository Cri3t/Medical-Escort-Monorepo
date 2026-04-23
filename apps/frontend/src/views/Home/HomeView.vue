<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

interface StoredUser {
  phone?: string;
  nickname?: string;
  role?: string;
}

const router = useRouter();

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
    return "用户";
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const escortCardTitle = computed(() =>
  user.value.role === "ESCORT" ? "陪诊员管理后台" : "成为陪诊员",
);

function goApplyEscort() {
  router.push("/profile/apply");
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"
      >
        <div>
          <p class="text-sm font-medium text-teal-700">
            Medical Escort Platform
          </p>
          <h1
            class="mt-1 text-2xl font-semibold tracking-normal text-slate-950"
          >
            医疗陪诊系统
          </h1>
        </div>
        <div
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
        >
          {{ displayName }}
        </div>
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 py-10">
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-950">首页</h2>
        <p class="mt-2 text-sm text-slate-500">选择你要使用的服务</p>
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
          <h3 class="text-lg font-semibold text-slate-950">预约陪诊</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            预约医院陪诊、就医协助等服务。
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500"
            disabled
          >
            即将开放
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
            提交入驻资料，成为平台认证陪诊员。
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
            @click="goApplyEscort"
          >
            进入
          </button>
        </article>
      </div>
    </section>
  </main>
</template>
