<script setup lang="ts">
type PageHeaderWidth = "wide" | "narrow";

interface Props {
  eyebrow?: string;
  title: string;
  width?: PageHeaderWidth;
}

withDefaults(defineProps<Props>(), {
  width: "wide",
});
</script>

<template>
  <header class="page-header">
    <div class="page-header__inner" :class="`page-header__inner--${width}`">
      <div>
        <p v-if="eyebrow" class="page-header__eyebrow">
          {{ eyebrow }}
        </p>
        <h1 class="page-header__title">
          {{ title }}
        </h1>
      </div>

      <div v-if="$slots.actions" class="page-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<style scoped src="./PageHeader.css"></style>
