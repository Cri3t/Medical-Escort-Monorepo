<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuSeparator } from 'reka-ui'
import { cn } from '@/lib/utils'

interface DropdownMenuSeparatorProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<DropdownMenuSeparatorProps>()
</script>

<template>
  <DropdownMenuSeparator
    :class="cn('-mx-1 my-1 h-px bg-slate-100', props.class)"
  />
</template>
