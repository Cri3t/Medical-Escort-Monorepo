<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { Primitive } from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90',
        destructive: 'bg-red-600 text-slate-50 shadow-sm hover:bg-red-600/90',
        outline: 'border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900',
        secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80',
        ghost: 'hover:bg-slate-100 hover:text-slate-900',
        link: 'text-slate-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface ButtonProps {
  as?: keyof HTMLElementTagNameMap | Component
  asChild?: boolean
  class?: HTMLAttributes['class']
  size?: ButtonVariants['size']
  variant?: ButtonVariants['variant']
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: 'button',
  asChild: false,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
