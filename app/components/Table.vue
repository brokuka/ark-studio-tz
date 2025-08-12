<script setup lang="ts">
import type { RestaurantData, Table } from '~~/shared/types'
import TableScale from './TableScale.vue'

const props = defineProps<{
  tables: Table[]
}>()

interface Event {
  id: string
  order?: string
  title: string
  status: string
  phone: string
  personCount: string
  startTime: string
  endTime: string
  time: string
  variant: 'banquet' | 'default' | 'reservation' | 'live'
}

const data = defineModel<RestaurantData>()
const jsLoaded = ref(false)
const tableScale = ref({ cellWidth: 80, cellHeight: 60 })
const activeHover = ref<HTMLElement | null>(null)

const timeToMinutesCache = new Map<string, number>()
const formatTimeCache = new Map<string, string>()
const requiredWidthCache = new Map<string, number>()
const requiredHeightCache = new Map<string, number>()

onMounted(() => {
  nextTick(() => {
    jsLoaded.value = true
  })
})

function handleScaleChange(newScale: { cellWidth: number, cellHeight: number }) {
  tableScale.value = { ...newScale }
  requiredWidthCache.clear()
  requiredHeightCache.clear()
}

const restaurant = computed(() => data.value?.restaurant)

const timeSlots = shallowRef<string[]>([])

watchEffect(() => {
  if (!restaurant.value)
    return

  const result: string[] = []
  const [openHour, openMinute] = restaurant.value.opening_time.split(':').map(Number) as [number, number]
  const [closeHour, closeMinute] = restaurant.value.closing_time.split(':').map(Number) as [number, number]
  let currentMinutes = openHour * 60 + openMinute
  const endMinutes = closeHour * 60 + closeMinute + (closeHour < openHour ? 24 * 60 : 0)

  while (currentMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60) % 24
    const minutes = currentMinutes % 60
    result.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
    currentMinutes += 30
  }
  timeSlots.value = result
})

function timeToMinutes(timeStr: string): number {
  if (timeToMinutesCache.has(timeStr)) {
    return timeToMinutesCache.get(timeStr)!
  }
  const time = timeStr.includes('T') ? timeStr.split('T')[1]?.split('.')[0] : timeStr
  const [hours, minutes] = time?.split(':').map(Number) as [number, number]
  const minutesTotal = hours * 60 + minutes
  timeToMinutesCache.set(timeStr, minutesTotal)
  return minutesTotal
}

function getAllEvents(table: Table): Event[] {
  const events: Event[] = []
  const statusMap = { New: 'Новый', Bill: 'Пречек', Closed: 'Закрытый' }

  for (const order of table.orders) {
    events.push({
      id: `order-${order.id}`,
      order: order.status !== 'Banquet' ? table.number.toString() : undefined,
      title: order.status === 'Banquet' ? 'Банкет' : 'Заказ',
      status: order.status === 'Banquet' ? '' : statusMap[order.status as keyof typeof statusMap] || order.status,
      phone: '',
      personCount: '',
      startTime: order.start_time,
      endTime: order.end_time,
      time: `${order.start_time}-${order.end_time}`,
      variant: order.status === 'Banquet' ? 'banquet' : 'default',
    })
  }

  for (const reservation of table.reservations) {
    events.push({
      id: `reservation-${reservation.id || reservation.name_for_reservation}`,
      order: table.number.toString(),
      title: reservation.name_for_reservation,
      status: reservation.status,
      phone: reservation.phone_number || '',
      personCount: reservation.num_people?.toString() || '',
      startTime: reservation.seating_time,
      endTime: reservation.end_time,
      time: `${reservation.seating_time}-${reservation.end_time}`,
      variant: reservation.status === 'Живая очередь' ? 'live' : 'reservation',
    })
  }

  return events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

const eventsCache = shallowReactive(new Map<string, Event[]>())

watchEffect(() => {
  eventsCache.clear()
  for (const table of props.tables) {
    eventsCache.set(table.id, getAllEvents(table))
  }
})

const renderingTimeSlotCache = new Map<string, string>()

function findRenderingTimeSlot(eventStartTime: string): string {
  const cacheKey = `${eventStartTime}-${timeSlots.value.length}`
  if (renderingTimeSlotCache.has(cacheKey)) {
    return renderingTimeSlotCache.get(cacheKey)!
  }

  const eventMinutes = timeToMinutes(eventStartTime)
  let bestSlot = timeSlots.value[0]
  let minDifference = Infinity

  for (const slot of timeSlots.value) {
    const slotMinutes = timeToMinutes(slot)
    if (eventMinutes >= slotMinutes && eventMinutes < slotMinutes + 30) {
      renderingTimeSlotCache.set(cacheKey, slot)
      return slot
    }
    const difference = Math.abs(eventMinutes - slotMinutes)
    if (difference < minDifference) {
      minDifference = difference
      bestSlot = slot
    }
  }

  renderingTimeSlotCache.set(cacheKey, bestSlot ?? '')
  return bestSlot ?? ''
}

function getEventsForTimeSlot(timeSlot: string, table: Table): Event[] {
  const events = eventsCache.get(table.id) || []
  return events.filter(event => findRenderingTimeSlot(event.startTime) === timeSlot)
}

function calculatePreciseTopPosition(eventStartTime: string, renderingTimeSlot: string): number {
  const eventMinutes = timeToMinutes(eventStartTime)
  const slotMinutes = timeToMinutes(renderingTimeSlot)
  const scaleRatio = tableScale.value.cellHeight / 60
  return Math.max(0, (eventMinutes - slotMinutes) * 2 * scaleRatio)
}

function calculateEventHeight(event: Event): number {
  const durationMinutes = timeToMinutes(event.endTime) - timeToMinutes(event.startTime)
  const scaleRatio = tableScale.value.cellHeight / 60
  return Math.max(20, durationMinutes * 2 * scaleRatio)
}

function calculateRequiredHeight(event: Event): number {
  const cacheKey = `height-${event.id}-${!!event.order}-${!!event.status}-${!!event.phone}`
  if (requiredHeightCache.has(cacheKey)) {
    return requiredHeightCache.get(cacheKey)!
  }

  const lineHeightSmall = 11.52
  const lineHeightLarge = 13.2
  const statusPadding = 4
  const marginBetween = 2
  const basePadding = 8

  let height = basePadding
  if (event.order)
    height += lineHeightSmall + marginBetween
  height += lineHeightLarge
  if (event.status || event.phone || event.personCount)
    height += marginBetween
  if (event.status)
    height += lineHeightSmall + statusPadding + marginBetween
  if (event.phone)
    height += lineHeightSmall + marginBetween
  height += lineHeightSmall + basePadding / 2

  const result = Math.max(60, Math.ceil(height))
  requiredHeightCache.set(cacheKey, result)
  return result
}

function eventsOverlap(event1: Event, event2: Event): boolean {
  const start1 = timeToMinutes(event1.startTime)
  const end1 = timeToMinutes(event1.endTime)
  const start2 = timeToMinutes(event2.startTime)
  const end2 = timeToMinutes(event2.endTime)
  return start1 < end2 && start2 < end1
}

function eventsSameStartTime(event1: Event, event2: Event): boolean {
  return Math.abs(timeToMinutes(event1.startTime) - timeToMinutes(event2.startTime)) <= 5
}

function isContentBlocked(parentEvent: Event, childEvent: Event, timeSlot: string): boolean {
  if (!eventsOverlap(parentEvent, childEvent))
    return false

  const parentTop = calculatePreciseTopPosition(parentEvent.startTime, timeSlot)
  const parentHeight = calculateEventHeight(parentEvent)
  const childTop = calculatePreciseTopPosition(childEvent.startTime, timeSlot)
  const childHeight = calculateEventHeight(childEvent)

  const headerHeight = 25
  const parentContentStart = parentTop + headerHeight
  const parentContentEnd = parentTop + parentHeight
  const childStart = childTop
  const childEnd = childTop + childHeight

  return childStart < parentContentEnd && childEnd > parentContentStart
}

function getSameTimeEventGroup(event: Event, timeSlot: string, table: Table): Event[] {
  const eventsInSlot = getEventsForTimeSlot(timeSlot, table)
  return eventsInSlot.filter(e => eventsSameStartTime(e, event)).sort((a, b) => a.id.localeCompare(b.id))
}

function getOverlappingEventsForEvent(event: Event, timeSlot: string, table: Table): Event[] {
  const eventsInSlot = getEventsForTimeSlot(timeSlot, table)
  return eventsInSlot.filter(e => e.id !== event.id && !eventsSameStartTime(e, event) && eventsOverlap(e, event))
}

function getContentBlockingEvents(event: Event, timeSlot: string, table: Table): Event[] {
  const eventsInSlot = getEventsForTimeSlot(timeSlot, table)
  const eventStart = timeToMinutes(event.startTime)

  return eventsInSlot.filter((e) => {
    if (e.id === event.id || eventsSameStartTime(e, event))
      return false
    const otherStart = timeToMinutes(e.startTime)
    return otherStart > eventStart && isContentBlocked(event, e, timeSlot)
  })
}

function shouldHideContent(event: Event, timeSlot: string, table: Table): boolean {
  return getContentBlockingEvents(event, timeSlot, table).length > 0
}

function getOverlappingEvents(event: Event, timeSlot: string, table: Table): number {
  const overlappingEvents = getOverlappingEventsForEvent(event, timeSlot, table)
  overlappingEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
  return overlappingEvents.filter(e => timeToMinutes(e.startTime) < timeToMinutes(event.startTime)).length
}

function hasOverlappingEvents(event: Event, timeSlot: string, table: Table): boolean {
  return getOverlappingEventsForEvent(event, timeSlot, table).length > 0
}

function calculateSameTimePosition(event: Event, timeSlot: string, table: Table) {
  const sameTimeGroup = getSameTimeEventGroup(event, timeSlot, table)
  const totalEvents = sameTimeGroup.length
  const eventIndex = sameTimeGroup.findIndex(e => e.id === event.id)
  const cellWidth = tableScale.value.cellWidth - 4

  if (totalEvents === 1)
    return { width: cellWidth, left: 2 }

  const eventWidth = Math.floor(cellWidth / totalEvents)
  const remainingWidth = cellWidth - (eventWidth * totalEvents)
  const actualWidth = eventWidth + (eventIndex < remainingWidth ? 1 : 0)
  const leftPosition = 2 + (eventIndex * eventWidth) + Math.min(eventIndex, remainingWidth)

  return { width: actualWidth, left: leftPosition }
}

function calculateOverlappingPosition(event: Event, timeSlot: string, table: Table) {
  const stackLevel = getOverlappingEvents(event, timeSlot, table)
  const baseWidth = tableScale.value.cellWidth - 4
  const leftOffset = 2 + (stackLevel * 4)
  return { width: Math.max(20, baseWidth - (stackLevel * 4)), left: leftOffset }
}

function shouldExpandOnHover(event: Event, timeSlot: string, table: Table): boolean {
  return getSameTimeEventGroup(event, timeSlot, table).length > 1 || hasOverlappingEvents(event, timeSlot, table)
}

function calculateRequiredWidth(event: Event): number {
  const cacheKey = `width-${event.id}-${event.title.length}-${event.order?.length || 0}-${event.status.length}-${event.phone.length}-${event.personCount.length}-${tableScale.value.cellWidth}`
  if (requiredWidthCache.has(cacheKey)) {
    return requiredWidthCache.get(cacheKey)!
  }

  const charWidthLarge = 7
  const charWidthSmall = 6
  const basePadding = 10
  const gap = 3
  const badgePadding = 8

  const widths: number[] = []

  let firstLineWidth = 0
  if (event.order) {
    firstLineWidth += (`№${event.order}`).length * charWidthSmall + gap
  }
  firstLineWidth += event.title.length * charWidthLarge
  if (event.personCount) {
    firstLineWidth += (`${event.personCount} чел`).length * charWidthSmall + gap + 1
  }
  widths.push(firstLineWidth)

  if (event.status) {
    widths.push(event.status.length * charWidthSmall + badgePadding)
  }

  if (event.phone) {
    widths.push(event.phone.length * charWidthSmall + gap)
  }

  const timeText = formatTimeFromEvent(event)
  widths.push(timeText.length * charWidthSmall + gap)

  const width = Math.max(...widths) + basePadding
  const minWidth = tableScale.value.cellWidth - 4
  const maxWidth = Math.max(134, tableScale.value.cellWidth * 1.5)
  const result = Math.min(Math.max(minWidth, Math.ceil(width)), maxWidth)

  requiredWidthCache.set(cacheKey, result)
  return result
}

function formatTimeFromEvent(event: Event): string {
  if (formatTimeCache.has(event.time)) {
    return formatTimeCache.get(event.time)!
  }

  let result: string
  if (event.time.includes('T')) {
    result = event.time.match(/T(\d{2}:\d{2})/g)?.map(t => t.slice(1)).join('-') || ''
  }
  else {
    result = event.time
  }

  formatTimeCache.set(event.time, result)
  return result
}

function getHoverClasses(event: Event, timeSlot: string, table: Table): string {
  return shouldExpandOnHover(event, timeSlot, table) || hasOverlappingEvents(event, timeSlot, table)
    ? 'group-hover/cell:backdrop-blur-xs group-hover/cell:blur-xs hover:blur-none hover:z-50 hover:!left-[2px]'
    : ''
}

const eventCardStyleCache = new Map<string, any>()

function getEventCardStyle(event: Event, timeSlot: string, table: Table) {
  const cacheKey = `${event.id}-${timeSlot}-${table.id}-${tableScale.value.cellWidth}-${tableScale.value.cellHeight}`
  if (eventCardStyleCache.has(cacheKey)) {
    return eventCardStyleCache.get(cacheKey)
  }

  const topPosition = calculatePreciseTopPosition(event.startTime, timeSlot)
  const height = calculateEventHeight(event)
  const sameTimeGroup = getSameTimeEventGroup(event, timeSlot, table)
  const hasOverlap = getOverlappingEvents(event, timeSlot, table) > 0
  const shouldExpand = shouldExpandOnHover(event, timeSlot, table)

  let width, left, zIndex

  if (sameTimeGroup.length > 1) {
    const position = calculateSameTimePosition(event, timeSlot, table)
    width = position.width
    left = position.left
    zIndex = 10
  }
  else if (hasOverlap) {
    const position = calculateOverlappingPosition(event, timeSlot, table)
    width = position.width
    left = position.left
    zIndex = 10 + getOverlappingEvents(event, timeSlot, table)
  }
  else {
    width = tableScale.value.cellWidth - 4
    left = 2
    zIndex = 10
  }

  const baseStyle = {
    top: `${topPosition}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: zIndex.toString(),
  }

  let result
  if (shouldExpand) {
    result = {
      ...baseStyle,
      '--original-width': `${width}px`,
      '--original-height': `${height}px`,
      '--hover-width': `${calculateRequiredWidth(event)}px`,
      '--original-z-index': zIndex.toString(),
    }
  }
  else if (hasOverlap) {
    result = {
      ...baseStyle,
      '--original-z-index': zIndex.toString(),
    }
  }
  else {
    result = baseStyle
  }

  eventCardStyleCache.set(cacheKey, result)
  return result
}

watch(() => [props.tables, tableScale.value], () => {
  eventCardStyleCache.clear()
  renderingTimeSlotCache.clear()
}, { deep: true })

function handleMouseEnter(mouseEvent: MouseEvent, event: Event, timeSlot: string, table: Table) {
  if (!jsLoaded.value)
    return

  const target = mouseEvent.currentTarget as HTMLElement
  if (!target)
    return

  const cell = target.closest('.group\\/cell') as HTMLElement

  if (hasOverlappingEvents(event, timeSlot, table) || shouldExpandOnHover(event, timeSlot, table)) {
    const allCards = cell.querySelectorAll('[data-event-id]') as NodeListOf<HTMLElement>
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i]
      if (card !== target) {
        card?.classList.add('backdrop-blur-xs', 'blur-xs')
      }
    }
    target.style.zIndex = '100'
  }

  if (shouldExpandOnHover(event, timeSlot, table)) {
    if (activeHover.value === target)
      return
    activeHover.value = target

    const requiredWidth = calculateRequiredWidth(event)
    const originalHeight = calculateEventHeight(event)
    const requiredHeight = calculateRequiredHeight(event)

    target.style.width = `${requiredWidth}px`
    if (originalHeight < 75) {
      target.style.height = `${requiredHeight}px`
    }
  }
}

function handleMouseLeave(mouseEvent: MouseEvent, event: Event, timeSlot: string, table: Table) {
  if (!jsLoaded.value)
    return

  const target = mouseEvent.currentTarget as HTMLElement
  if (!target)
    return

  const cell = target.closest('.group\\/cell') as HTMLElement

  if (hasOverlappingEvents(event, timeSlot, table) || shouldExpandOnHover(event, timeSlot, table)) {
    const allCards = cell.querySelectorAll('[data-event-id]') as NodeListOf<HTMLElement>
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i]
      card?.classList.remove('backdrop-blur-xs', 'blur-xs')
    }
    const originalZIndex = target.style.getPropertyValue('--original-z-index') || getEventCardStyle(event, timeSlot, table).zIndex
    target.style.zIndex = originalZIndex
  }

  if (shouldExpandOnHover(event, timeSlot, table)) {
    if (activeHover.value !== target)
      return
    activeHover.value = null

    const originalWidth = target.style.getPropertyValue('--original-width')
    const originalHeight = target.style.getPropertyValue('--original-height')

    target.style.width = originalWidth
    target.style.height = originalHeight
  }
}
</script>

<template>
  <div
    class="overflow-hidden h-full w-full dark:text-white relative table-container"
    :class="{ 'pointer-events-none': !jsLoaded }"
  >
    <TableScale :initial-scale="tableScale" @scale-change="handleScaleChange" />

    <div class="overflow-x-auto overflow-y-auto h-full table-scroll-container scroll-">
      <table class="border-separate border-spacing-0 min-w-max">
        <thead class="sticky top-0 z-[300] bg-white dark:bg-gray-900">
          <tr class="text-xs">
            <th
              class="sticky left-0 z-40"
              :style="{ width: `${tableScale.cellWidth}px`, height: `${tableScale.cellHeight}px` }"
            />
            <th
              v-for="table in tables" :key="table.id"
              class="text-black/64 dark:text-white/64 border-l-0 border-b border-black/16 dark:border-white/16 p-2 flex-shrink-0 overflow-hidden bg-white dark:bg-gray-900"
              :style="{
                width: `${tableScale.cellWidth}px`,
                height: `${tableScale.cellHeight}px`,
                minWidth: `${tableScale.cellWidth}px`,
                maxWidth: `${tableScale.cellWidth}px`,
              }"
            >
              <div class="flex gap-1 items-center justify-center whitespace-nowrap text-ellipsis overflow-hidden">
                <span>#</span><span class="font-semibold text-[13px]">{{ table.number }}</span>
                <span class="whitespace-nowrap text-ellipsis overflow-hidden">{{ table.capacity }} чел</span>
              </div>
              <div class="text-gray-400 whitespace-nowrap text-ellipsis overflow-hidden">
                {{ table.zone }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="timeSlot in timeSlots" :key="timeSlot">
            <td
              class="text-xs text-center sticky left-0 z-10 align-middle bg-white dark:bg-gray-900"
              :style="{ width: `${tableScale.cellWidth}px`, height: `${tableScale.cellHeight}px` }"
            >
              {{ timeSlot }}
            </td>
            <td
              v-for="table in tables" :key="`${timeSlot}-${table.id}`"
              class="border border-black/16 dark:border-white/16 border-t-0 border-l-0 text-center relative p-0 flex-shrink-0"
              :style="{ width: `${tableScale.cellWidth}px`, height: `${tableScale.cellHeight}px` }"
            >
              <div class="h-full w-full relative group/cell">
                <template
                  v-for="event in getEventsForTimeSlot(timeSlot, table)"
                  :key="`${timeSlot}-${table.id}-${event.id}`"
                >
                  <div
                    class="group/card absolute rounded-sm transition-all duration-200"
                    :class="getHoverClasses(event, timeSlot, table)" :style="getEventCardStyle(event, timeSlot, table)"
                    :data-event-id="event.id" @mouseenter="handleMouseEnter($event, event, timeSlot, table)"
                    @mouseleave="handleMouseLeave($event, event, timeSlot, table)"
                  >
                    <EventCard
                      :order="event.order" :title="event.title" :status="event.status" :time="event.time"
                      :phone="event.phone" :person-count="event.personCount" :variant="event.variant"
                      :content-hidden="shouldHideContent(event, timeSlot, table)" class="h-full w-full"
                      :class="{ 'whitespace-nowrap': shouldExpandOnHover(event, timeSlot, table) }"
                    />
                  </div>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  position: relative;
  width: 100%;
  height: 750px;
  overflow: hidden;
}

.table-scroll-container {
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
}

thead.sticky {
  position: sticky;
  top: 0;
  z-index: 30;
}

th.sticky {
  position: sticky;
  left: 0;
  z-index: 40;
}

td.sticky {
  position: sticky;
  left: 0;
  z-index: 10;
  background: inherit;
  /* Ensure background consistency */
}
</style>
