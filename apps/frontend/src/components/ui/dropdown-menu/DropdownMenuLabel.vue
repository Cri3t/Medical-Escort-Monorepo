<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

interface DropdownMenuLabelProps {
  class?: HTMLAttributes['class']
  inset?: boolean
}

const props = defineProps<DropdownMenuLabelProps>()
</script>

<template>
  <DropdownMenuLabel
    :class="
      cn(
        'px-2 py-1.5 text-sm font-semibold tracking-normal',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuLabel>
</template>
