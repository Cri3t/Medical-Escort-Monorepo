<script setup lang="ts">
import { MapPin } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import type { PublicEscortProfile } from "@/api/escort";
import { Button } from "@/components/ui/button";
import type { BookingFormState } from "../types";

interface Props {
  selectedEscort: PublicEscortProfile;
  submitLoading: boolean;
}

const props = defineProps<Props>();

const form = defineModel<BookingFormState>("form", {
  required: true,
});

const emit = defineEmits<{
  close: [];
  openMap: [];
  submit: [];
}>();

const { t } = useI18n();

function getEscortName(escort: PublicEscortProfile) {
  return escort.user.nickname || t("book.unnamedEscort");
}
</script>

<template>
  <div class="book-dialog-backdrop" @click.self="emit('close')">
    <section class="book-dialog">
      <div class="book-dialog__header">
        <p class="book-dialog__eyebrow">
          {{ getEscortName(props.selectedEscort) }}
        </p>
        <h2 class="book-dialog__title">
          {{ t("book.dialogTitle") }}
        </h2>
      </div>

      <form class="book-form" @submit.prevent="emit('submit')">
        <label class="book-field">
          <span class="book-field__label">
            {{ t("book.hospitalName") }}
          </span>
          <div class="book-field__control">
            <input
              v-model="form.hospitalName"
              type="text"
              autocomplete="off"
              class="book-field__input book-field__input--with-action"
              :placeholder="t('book.hospitalPlaceholder')"
            />
            <button
              type="button"
              class="book-field__map-button"
              :aria-label="t('book.selectHospitalOnMap')"
              @click="emit('openMap')"
            >
              <MapPin class="book-icon" aria-hidden="true" />
            </button>
          </div>
        </label>

        <label class="book-field">
          <span class="book-field__label">
            {{ t("book.serviceTime") }}
          </span>
          <input
            v-model="form.serviceAt"
            type="datetime-local"
            class="book-field__input"
          />
        </label>

        <label class="book-field">
          <span class="book-field__label">
            {{ t("book.bookingAmount") }}
          </span>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="0.01"
            class="book-field__input"
          />
        </label>

        <label class="book-field">
          <span class="book-field__label">
            {{ t("book.remark") }}
          </span>
          <textarea
            v-model="form.remark"
            rows="4"
            class="book-field__textarea"
            :placeholder="t('book.remarkPlaceholder')"
          ></textarea>
        </label>

        <div class="book-dialog__actions">
          <Button
            type="button"
            variant="outline"
            :disabled="props.submitLoading"
            @click="emit('close')"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button
            type="submit"
            class="book-submit-button"
            :disabled="props.submitLoading"
          >
            {{
              props.submitLoading
                ? t("common.submitting")
                : t("book.confirmBooking")
            }}
          </Button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.book-dialog-backdrop {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6;
}

.book-dialog {
  @apply w-full max-w-lg rounded-lg bg-white p-6 shadow-xl;
}

.book-dialog__header {
  @apply mb-6;
}

.book-dialog__eyebrow {
  @apply text-sm font-medium text-teal-700;
}

.book-dialog__title {
  @apply mt-1 text-xl font-semibold tracking-normal text-slate-950;
}

.book-form {
  @apply space-y-5;
}

.book-field {
  @apply block;
}

.book-field__label {
  @apply mb-2 block text-sm font-medium text-slate-700;
}

.book-field__control {
  @apply relative;
}

.book-field__input {
  @apply w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.book-field__input--with-action {
  @apply pr-12;
}

.book-field__map-button {
  @apply absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-200;
}

.book-field__textarea {
  @apply w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100;
}

.book-dialog__actions {
  @apply flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end;
}

.book-submit-button {
  @apply bg-teal-600 hover:bg-teal-700;
}

.book-icon {
  @apply h-4 w-4;
}
</style>
