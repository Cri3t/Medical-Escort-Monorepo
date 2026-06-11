import { computed, ref } from "vue";
import type { Router } from "vue-router";
import type { PublicEscortProfile } from "@/api/escort";
import { createOrder } from "@/api/order";
import type { OrderForm } from "../types";

type Translate = (key: string) => string;

function initialForm(): OrderForm {
  return {
    hospitalName: "",
    serviceAt: "",
    amount: 150,
    remark: "",
  };
}

export function useBookingForm(router: Router, t: Translate) {
  const submitLoading = ref(false);
  const selectedEscort = ref<PublicEscortProfile | null>(null);
  const form = ref<OrderForm>(initialForm());

  const isDialogOpen = computed(() => selectedEscort.value !== null);

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

  function setHospitalName(hospitalName: string) {
    form.value.hospitalName = hospitalName;
  }

  async function submitBooking() {
    if (submitLoading.value) {
      return;
    }

    if (!selectedEscort.value) {
      alert(t("book.selectEscortAlert"));
      return;
    }

    const hospitalName = form.value.hospitalName.trim();
    const serviceAt = form.value.serviceAt;
    const amount = Number(form.value.amount);
    const remark = form.value.remark.trim();

    if (!hospitalName) {
      alert(t("book.hospitalRequired"));
      return;
    }

    if (!serviceAt) {
      alert(t("book.serviceTimeRequired"));
      return;
    }

    const serviceDate = new Date(serviceAt);

    if (Number.isNaN(serviceDate.getTime())) {
      alert(t("book.invalidServiceTime"));
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      alert(t("book.invalidAmount"));
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

      alert(t("book.createSuccess"));
      await router.push("/orders");
    } finally {
      submitLoading.value = false;
    }
  }

  return {
    form,
    isDialogOpen,
    selectedEscort,
    submitLoading,
    closeDialog,
    openDialog,
    setHospitalName,
    submitBooking,
  };
}
