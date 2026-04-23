<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { DropdownMenuItem } from 'reka-ui'
import { cn } from '@/lib/utils'

interface DropdownMenuItemProps {
  class?: HTMLAttributes['class']
  disabled?: boolean
  inset?: boolean
}

const props = defineProps<DropdownMenuItemProps>()

const delegatedProps = computed(() => {
  const { class: _class, inset: _inset, ...delegated } = props

  return delegated
})
</script>

<template>
  <DropdownMenuItem
    v-bind="delegatedProps"
    :class="
      cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm tracking-normal outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
