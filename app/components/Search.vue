<script setup lang="ts">
import type { RestaurantData } from '~~/shared/types'

const isOpen = defineModel<boolean>('open')
const { data } = useNuxtData<RestaurantData>('data')

const { Meta_K, Ctrl_K } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key !== 'k')
      return

    if (e.key === 'k' && (e.metaKey || e.ctrlKey))
      e.preventDefault()
  },
})

watch([Meta_K, Ctrl_K], (v) => {
  if (v[0] || v[1])
    isOpen.value = true
})

const reservations = computed(() => {
  return data.value?.tables.map(table => table.reservations).flat()
})
</script>

<template>
  <UiCommandDialog v-if="data?.tables" v-model:open="isOpen">
    <UiCommandInput placeholder="Введите Имя..." />
    <UiCommandList>
      <UiCommandEmpty>Ничего не найдено.</UiCommandEmpty>
      <UiCommandGroup heading="Забронированно">
        <UiCommandItem
          v-for="reservation in reservations" :key="reservation.id" :value="reservation.id"
          class="flex flex-col items-start"
        >
          <span class="font-semibold">{{ reservation.name_for_reservation }} ({{ formatDate(reservation.seating_time).formatted }})</span>
          <div class="flex gap-1">
            <span>{{ reservation.num_people }} чел</span> <span>{{ formatTimeRange(reservation.seating_time) }}-{{ formatTimeRange(reservation.end_time)
            }}</span>
          </div>
        </UiCommandItem>
      </UiCommandGroup>
    </UiCommandList>
  </UiCommandDialog>
</template>
