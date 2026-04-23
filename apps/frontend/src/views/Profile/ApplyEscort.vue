<script setup lang="ts">
import { ref } from 'vue'
import request from '../../utils/request'

const idCardPattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

const idCardNo = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!idCardPattern.test(idCardNo.value)) {
    alert('请输入正确的 18 位身份证号码')
    return
  }

  loading.value = true

  try {
    await request.post('/escort-profile/apply', {
      idCardNo: idCardNo.value,
    })

    alert('申请提交成功')
    idCardNo.value = ''
  }
  catch {
    // 错误提示由请求拦截器统一处理。
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
    <section class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70">
      <div class="mb-8 text-center">
        <p class="mb-3 text-sm font-medium text-teal-700">Escort Application</p>
        <h1 class="text-3xl font-semibold tracking-normal text-slate-950">陪诊员入驻申请</h1>
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">身份证号</span>
          <input
            v-model="idCardNo"
            type="text"
            maxlength="18"
            autocomplete="off"
            placeholder="请输入 18 位身份证号码"
            class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
          />
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-teal-400"
        >
          {{ loading ? '提交中...' : '提交申请' }}
        </button>
      </form>
    </section>
  </main>
</template>
