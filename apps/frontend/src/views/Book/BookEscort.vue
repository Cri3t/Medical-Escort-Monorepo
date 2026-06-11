<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { getPublicProfiles } from "@/api/escort";
import type { PublicEscortProfile } from "@/api/escort";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import BookingDialog from "./components/BookingDialog.vue";
import EscortCardGrid from "./components/EscortCardGrid.vue";
import HospitalMapPicker from "./components/HospitalMapPicker.vue";
import { useBookingForm } from "./composables/useBookingForm";

const escorts = ref<PublicEscortProfile[]>([]);
const loading = ref(false);
const isMapPickerOpen = ref(false);
const router = useRouter();
const { t } = useI18n();

const {
  form,
  isDialogOpen,
  selectedEscort,
  submitLoading,
  closeDialog,
  openDialog,
  setHospitalName,
  submitBooking,
} = useBookingForm(router, t);

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

function openMapPicker() {
  isMapPickerOpen.value = true;
}

function closeMapPicker() {
  isMapPickerOpen.value = false;
}

function closeBookingDialog() {
  if (submitLoading.value) {
    return;
  }

  closeMapPicker();
  closeDialog();
}
</script>

<template>
  <main class="book-page">
    <PageHeader :eyebrow="t('book.eyebrow')" :title="t('book.title')" />

    <section class="book-shell">
      <EscortCardGrid
        :escorts="escorts"
        :loading="loading"
        @book="openDialog"
      />
    </section>

    <BookingDialog
      v-if="isDialogOpen && selectedEscort"
      v-model:form="form"
      :selected-escort="selectedEscort"
      :submit-loading="submitLoading"
      @close="closeBookingDialog"
      @open-map="openMapPicker"
      @submit="submitBooking"
    />

    <HospitalMapPicker
      v-if="isMapPickerOpen"
      :initial-keyword="form.hospitalName"
      @close="closeMapPicker"
      @select="setHospitalName"
    />
  </main>
</template>

<style scoped>
.book-page {
  @apply min-h-screen bg-slate-50 text-slate-900;
}

.book-shell {
  @apply mx-auto max-w-6xl px-4 py-8;
}
</style>
