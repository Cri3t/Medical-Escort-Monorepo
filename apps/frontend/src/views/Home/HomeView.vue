<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import UserNav from "@/components/UserNav.vue";

interface StoredUser {
  nickname?: string;
  phone?: string;
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
  user.value.role === "ESCORT" ? "陪诊员工作台" : "申请成为陪诊员",
);

function goApplyEscort() {
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
            医疗陪诊服务平台
          </h1>
        </div>
        <UserNav :display-name="displayName" :user="user" />
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 py-10">
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-slate-950">服务入口</h2>
        <p class="mt-2 text-sm text-slate-500">
          根据当前身份选择预约陪诊、申请成为陪诊员或管理服务信息。
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
          <h3 class="text-lg font-semibold text-slate-950">预约陪诊</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            提交就医需求，匹配专业陪诊员协助挂号、候诊、取药与检查流程。
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
            完善资质信息后可承接陪诊订单，管理服务范围、接单状态与个人资料。
          </p>
          <button
            type="button"
            class="mt-6 w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
            @click="goApplyEscort"
          >
            立即前往
          </button>
        </article>
      </div>
    </section>
  </main>
</template>
