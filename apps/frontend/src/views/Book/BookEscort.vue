<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getPublicProfiles } from "@/api/escort";
import type { PublicEscortProfile } from "@/api/escort";
import { createOrder } from "@/api/order";
import { Button } from "@/components/ui/button";

interface OrderForm {
  hospitalName: string;
  serviceAt: string;
  amount: number;
  remark: string;
}

const initialForm = (): OrderForm => ({
  hospitalName: "",
  serviceAt: "",
  amount: 150,
  remark: "",
});

const escorts = ref<PublicEscortProfile[]>([]);
const loading = ref(false);
const submitLoading = ref(false);
const selectedEscort = ref<PublicEscortProfile | null>(null);
const form = ref<OrderForm>(initialForm());

const isDialogOpen = computed(() => selectedEscort.value !== null);

onMounted(() => {
  void loadEscorts();
});

async function loadEscorts() {
  loading.value = true;

  try {
    escorts.value = await getPublicProfiles();
  } finally {
    loading.value = false;
  }
}

function openDialog(escort: PublicEscortProfile) {
  selectedEscort.value = escort;
}

function closeDialog() {
  if (submitLoading.value) {
    return;
  }

  selectedEscort.value = null;
  resetForm();
}

function resetForm() {
  form.value = initialForm();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getEscortName(escort: PublicEscortProfile) {
  return escort.user.nickname || "Unnamed Escort";
}

async function handleSubmit() {
  if (submitLoading.value) {
    return;
  }

  if (!selectedEscort.value) {
    alert("Please select an escort");
    return;
  }

  const hospitalName = form.value.hospitalName.trim();
  const serviceAt = form.value.serviceAt;
  const amount = Number(form.value.amount);
  const remark = form.value.remark.trim();

  if (!hospitalName) {
    alert("Please enter the hospital name");
    return;
  }

  if (!serviceAt) {
    alert("Please select a service time");
    return;
  }

  const serviceDate = new Date(serviceAt);

  if (Number.isNaN(serviceDate.getTime())) {
    alert("Please select a valid service time");
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("Please enter a valid booking amount");
    return;
  }

  submitLoading.value = true;

  try {
    await createOrder({
      escortId: selectedEscort.value.userId,
      hospitalName,
      serviceAt: serviceDate.toISOString(),
      amount,
      ...(remark ? { remark } : {}),
    });

    alert("Booking created successfully");
    selectedEscort.value = null;
    resetForm();
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
    <section class="mx-auto max-w-6xl">
      <div class="mb-8">
        <p class="text-sm font-medium text-teal-700">Book Escort Service</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
          Available Escorts
        </h1>
      </div>

      <div
        v-if="loading"
        class="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        <div
          v-for="index in 6"
          :key="index"
          class="h-56 animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="h-14 w-14 rounded-full bg-slate-200"></div>
          <div class="mt-6 h-5 w-32 rounded bg-slate-200"></div>
          <div class="mt-3 h-4 w-44 rounded bg-slate-100"></div>
          <div class="mt-8 h-10 rounded bg-slate-200"></div>
        </div>
      </div>

      <div
        v-else-if="escorts.length === 0"
        class="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500"
      >
        No available escorts
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        <article
          v-for="escort in escorts"
          :key="escort.id"
          class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-semibold text-teal-700"
            >
              {{ getEscortName(escort).slice(0, 1) }}
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold text-slate-950">
                {{ getEscortName(escort) }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Joined on: {{ formatDate(escort.createdAt) }}
              </p>
            </div>
          </div>

          <Button
            type="button"
            class="mt-8 w-full bg-teal-600 hover:bg-teal-700"
            @click="openDialog(escort)"
          >
            Book
          </Button>
        </article>
      </div>
    </section>

    <div
      v-if="isDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      @click.self="closeDialog"
    >
      <section class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div class="mb-6">
          <p class="text-sm font-medium text-teal-700">
            {{ selectedEscort ? getEscortName(selectedEscort) : "" }}
          </p>
          <h2 class="mt-1 text-xl font-semibold tracking-normal text-slate-950">
            Book Escort Service
          </h2>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Hospital Name
            </span>
            <input
              v-model="form.hospitalName"
              type="text"
              autocomplete="off"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Enter the hospital name"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Service Time
            </span>
            <input
              v-model="form.serviceAt"
              type="datetime-local"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Booking Amount
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">
              Remark
            </span>
            <textarea
              v-model="form.remark"
              rows="4"
              class="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Add patient details, service needs, or other notes"
            ></textarea>
          </label>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              :disabled="submitLoading"
              @click="closeDialog"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              class="bg-teal-600 hover:bg-teal-700"
              :disabled="submitLoading"
            >
              {{ submitLoading ? "Submitting..." : "Confirm Booking" }}
            </Button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
