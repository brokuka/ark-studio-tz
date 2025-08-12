<script setup lang="ts">
import type { RestaurantData } from '~~/shared/types'

const data = defineModel<RestaurantData>()
const activeZones = defineModel<string[]>('activeZones')
const activeDays = defineModel<string[]>('activeDays')

const avaliableZones = ref(Array.from(new Set(data.value?.tables.map(table => table.zone))))
const availableDays = ref(data.value?.available_days)

watch(activeZones, (newValue) => {
  if (!newValue?.length) {
    activeZones.value = avaliableZones.value
  }
})

watch(activeDays, (newValue) => {
  if (!newValue?.length) {
    activeDays.value = availableDays.value
  }
})
</script>

<template>
  <div class="mb-[33px]">
    <h2 class="font-bold text-xl dark:text-white mb-4">
      Бронирования
    </h2>

    <div class="flex flex-col gap-4">
      <TableFilter v-model="availableDays" v-model:active="activeDays" title="Дата" multi-select>
        <template #data="{ item }">
          <span class="font-semibold">{{ formatDate(item).formatted }}</span>
          <span>{{ formatDate(item).label }}</span>
        </template>
      </TableFilter>

      <TableFilter v-model="avaliableZones" v-model:active="activeZones" title="Отображаемые зоны" multi-select />
    </div>
  </div>
</template>
