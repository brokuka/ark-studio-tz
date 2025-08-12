<script setup lang="ts">
const { data } = await useFetch('/api/data', {
  key: 'data',
})

const activeZones = ref<string[]>(['1 этаж'])
const availableDays = ref<string[]>([data.value?.available_days[0] ?? ''])

const tables = computed(() => {
  if (!data.value)
    return []

  return data.value.tables.filter((table) => {
    const matchesZone = activeZones.value.includes(table.zone)

    const matchesDay = availableDays.value.some((day) => {
      const dayStart = new Date(`${day}T00:00:00`)
      const dayEnd = new Date(`${day}T23:59:59`)

      const hasOrdersOnDay = table.orders?.some((order) => {
        const orderStart = new Date(order.start_time)
        const orderEnd = new Date(order.end_time)

        return orderStart <= dayEnd && orderEnd >= dayStart
      })

      const hasReservationsOnDay = table.reservations?.some((reservation) => {
        const reservationStart = new Date(reservation.seating_time)
        const reservationEnd = new Date(reservation.end_time)

        return reservationStart <= dayEnd && reservationEnd >= dayStart
      })

      return hasOrdersOnDay || hasReservationsOnDay
    })

    return matchesZone && matchesDay
  })
})
</script>

<template>
  <Header />

  <div v-if="data" class="py-2">
    <div class="@container px-5 relative">
      <Reservation v-model="data" v-model:active-zones="activeZones" v-model:active-days="availableDays" />
    </div>

    <Table v-model="data" :tables />
  </div>
</template>
