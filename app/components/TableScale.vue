<script setup lang="ts">
interface ScaleState {
  cellWidth: number
  cellHeight: number
}

const props = defineProps<{
  initialScale?: ScaleState
}>()

const emit = defineEmits<{
  scaleChange: [scale: ScaleState]
}>()

const MIN_CELL_WIDTH = 64
const MAX_CELL_WIDTH = 160
const MIN_CELL_HEIGHT = 48
const MAX_CELL_HEIGHT = 120
const HORIZONTAL_STEP = 16
const VERTICAL_STEP = 4

const tableScale = ref<ScaleState>(props.initialScale || {
  cellWidth: 80,
  cellHeight: 60,
})

const draggableState = ref({
  isDragging: false,
  startX: 0,
  startY: 0,
  currentX: 200,
  currentY: 16,
  offsetX: 0,
  offsetY: 0,
})

const jsLoaded = ref(false)

onMounted(() => {
  nextTick(() => {
    jsLoaded.value = true
    setupKeyboardListeners()
  })
})

function handleScaleMinus() {
  tableScale.value = {
    cellWidth: Math.max(MIN_CELL_WIDTH, tableScale.value.cellWidth - HORIZONTAL_STEP),
    cellHeight: Math.max(MIN_CELL_HEIGHT, tableScale.value.cellHeight - VERTICAL_STEP),
  }
  emit('scaleChange', { ...tableScale.value })
}

function handleScalePlus() {
  tableScale.value = {
    cellWidth: Math.min(MAX_CELL_WIDTH, tableScale.value.cellWidth + HORIZONTAL_STEP),
    cellHeight: Math.min(MAX_CELL_HEIGHT, tableScale.value.cellHeight + VERTICAL_STEP),
  }
  emit('scaleChange', { ...tableScale.value })
}

function onClickMinusButton(event: Event) {
  event.stopPropagation()
  handleScaleMinus()
}

function onClickPlusButton(event: Event) {
  event.stopPropagation()
  handleScalePlus()
}

function setupKeyboardListeners() {
  document.addEventListener('keydown', handleKeydown)
}

function handleKeydown(event: KeyboardEvent) {
  const activeElement = document.activeElement as HTMLElement
  const isInputFocused = activeElement?.tagName === 'INPUT'
    || activeElement?.tagName === 'TEXTAREA'
    || activeElement?.contentEditable === 'true'

  if (isInputFocused)
    return

  if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
    event.preventDefault()
    handleScalePlus()
  }

  if (event.key === '-' || event.code === 'NumpadSubtract') {
    event.preventDefault()
    handleScaleMinus()
  }

  if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
    event.preventDefault()
    if (event.key === '+' || event.key === '=') {
      handleScalePlus()
    }
    else {
      handleScaleMinus()
    }
  }
}

function handleDragStart(event: MouseEvent | TouchEvent) {
  if (!jsLoaded.value)
    return

  draggableState.value.isDragging = true

  const clientX = 'touches' in event ? event.touches[0]!.clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0]!.clientY : event.clientY

  draggableState.value.startX = clientX
  draggableState.value.startY = clientY
  draggableState.value.offsetX = clientX - draggableState.value.currentX
  draggableState.value.offsetY = clientY - draggableState.value.currentY

  event.preventDefault()

  if ('touches' in event) {
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
  }
  else {
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }
}

function handleDragMove(event: MouseEvent | TouchEvent) {
  if (!draggableState.value.isDragging)
    return

  event.preventDefault()

  const clientX = 'touches' in event ? event.touches[0]!.clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0]!.clientY : event.clientY

  const container = document.querySelector('.table-container') as HTMLElement
  if (!container)
    return

  const containerRect = container.getBoundingClientRect()
  const scaleComponentWidth = 140
  const scaleComponentHeight = 100

  let newX = clientX - draggableState.value.offsetX
  let newY = clientY - draggableState.value.offsetY

  newX = Math.max(0, Math.min(newX, containerRect.width - scaleComponentWidth))
  newY = Math.max(0, Math.min(newY, containerRect.height - scaleComponentHeight))

  draggableState.value.currentX = newX
  draggableState.value.currentY = newY
}

function handleDragEnd() {
  draggableState.value.isDragging = false

  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDragMove)
  document.removeEventListener('touchend', handleDragEnd)
}

onUnmounted(() => {
  handleDragEnd()
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => props.initialScale, (newScale) => {
  if (newScale) {
    tableScale.value = { ...newScale }
  }
}, { deep: true })
</script>

<template>
  <div
    class="z-30 select-none fixed" :class="{
      'cursor-grabbing': draggableState.isDragging,
      'cursor-grab': !draggableState.isDragging,
      'pointer-events-none': !jsLoaded,
    }" :style="{
      left: `${draggableState.currentX}px`,
      top: `${draggableState.currentY}px`,
      touchAction: 'none',
    }" @mousedown="handleDragStart" @touchstart="handleDragStart"
  >
    <div
      class="bg-gray-100 dark:bg-[#222222] border border-white/16 py-2 px-[14.5px] rounded-lg flex flex-col gap-1 shadow-lg backdrop-blur-sm"
    >
      <div class="flex items-center justify-between">
        <span class="font-semibold text-[0.8125rem] dark:text-white">Масштаб</span>
      </div>

      <div class="flex gap-1">
        <button
          class="rounded-sm bg-gray-200 hover:bg-gray-200/70 dark:bg-white/4 dark:hover:bg-white/15 hover:cursor-pointer transition-all duration-200 active:scale-95 relative group flex justify-center items-center  p-1"
          title="Уменьшить масштаб (клавиша -)" @click="onClickMinusButton" @mousedown.stop @touchstart.stop
        >
          <IconMinus class="size-4" />
        </button>

        <button
          class="rounded-sm bg-gray-200 dark:bg-white/4 hover:bg-gray-200/70 dark:hover:bg-white/15 hover:cursor-pointer transition-all duration-200 active:scale-95 relative group flex justify-center items-center p-1"
          title="Увеличить масштаб (клавиша +)" @click="onClickPlusButton" @mousedown.stop @touchstart.stop
        >
          <IconPlus class="size-4" />
        </button>
      </div>

      <div class="text-[10px] dark:text-white/50 text-center mt-1">
        +/- клавиши
      </div>
    </div>
  </div>
</template>
