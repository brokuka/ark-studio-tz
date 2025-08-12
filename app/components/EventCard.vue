<script lang="ts">
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'

interface Props {
  order?: string
  title: string
  status?: string
  time: string
  phone?: string
  personCount?: string
  contentHidden?: boolean
}
</script>

<script setup lang="ts">
type EventCardVariants = VariantProps<typeof eventCardVariants>

const props = defineProps<Props & {
  variant?: EventCardVariants['variant']
  class?: HTMLAttributes['class']
}>()

const isHovered = ref(false)

const eventCardVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-[#7FD7CC]/35 dark:bg-[#7FD7CC]/16',
      banquet: 'bg-[#B348F7]/35 dark:bg-[#B348F7]/16',
      live: 'bg-[#0097FD]/35 dark:bg-[#0097FD]/16',
      reservation: 'bg-[#FF7043]/35 dark:bg-[#FF7043]/16',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const cardStripeVariants = cva('absolute left-0 top-0 bottom-0 w-0.5', {
  variants: {
    variant: {
      default: 'bg-[#7FD7CC]',
      banquet: 'bg-[#B348F7]',
      live: 'bg-[#0097FD]',
      reservation: 'bg-[#FF7043]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function getStatusColor(status: string) {
  if (status === 'Ожидает подтверждения') {
    return 'bg-[#007AFF]! text-white!'
  }

  if (status === 'Ожидаем') {
    return 'bg-[#0097FD]/10! text-[#0097FD]!'
  }

  if (status === 'В зале' || status === 'Пречек') {
    return 'bg-[#4AC99B]/75 dark:bg-[#4AC99B]/12'
  }
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-sm h-full w-full group/event-card text-left"
    :class="cn(eventCardVariants({ variant }))"
  >
    <div :class="cn(cardStripeVariants({ variant }))" />

    <div
      :class="cn('flex flex-col pl-2 dark:text-white py-1 text-[0.6875rem] pr-0.5 h-full', props.class)"
      :style="contentHidden && !isHovered ? { maxHeight: '100%', overflow: 'hidden' } : {}"
      @mouseenter="isHovered = true" @mouseleave="isHovered = false"
    >
      <span v-if="order" class="text-[0.6rem] leading-tight">№{{ order }}</span>

      <div class="font-semibold inline-flex gap-1 leading-tight">
        <h3 class="text-[0.6875rem] leading-tight">
          {{ title }}<span v-if="personCount">;</span>
        </h3>
        <template v-if="personCount">
          <span class="font-semibold text-[0.6875rem]">{{ personCount }}<span class="text-[0.6rem]">чел</span></span>
        </template>
      </div>

      <template v-if="!contentHidden || isHovered">
        <span
          v-if="status"
          :class="cn('rounded-sm bg-black/12 dark:bg-white/12 px-1 py-0.5 w-fit text-[0.6rem] font-semibold leading-tight mt-0.5', getStatusColor(status))"
        >
          {{ status }}
        </span>

        <span v-if="phone" class="text-[0.6rem] mt-0.5">{{ phone }}</span>

        <time :datetime="time" class="text-[0.6rem] mt-auto text-left">{{ formatTimeRange(time) }}</time>
      </template>

      <span v-else-if="contentHidden && !isHovered" class="text-xs dark:text-white mt-0.5 top-0 absolute right-2">...</span>
    </div>
  </div>
</template>
