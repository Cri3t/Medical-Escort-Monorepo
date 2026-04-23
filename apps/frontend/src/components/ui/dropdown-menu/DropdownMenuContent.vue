<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { DropdownMenuContent, DropdownMenuPortal } from 'reka-ui'
import { cn } from '@/lib/utils'

interface DropdownMenuContentProps {
  align?: 'start' | 'center' | 'end'
  class?: HTMLAttributes['class']
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

const props = withDefaults(defineProps<DropdownMenuContentProps>(), {
  align: 'center',
  sideOffset: 4,
})

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = props

  return delegated
})
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      v-bind="delegatedProps"
      :class="
        cn(
          'z-50 min-w-32 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md outline-none',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
